import type { ReactNode } from "react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { NextIntlClientProvider } from "next-intl";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import messages from "../../../../../messages/vi.json";
import { initialCheckoutInvoice, type CheckoutInvoice } from "./data";
import { calculatePaymentTotals } from "./payment-state";

const branchLookup = vi.hoisted(() => vi.fn());
vi.mock("@/service", () => ({ useAdminBranchDetail: branchLookup }));
// Render portal contents in the Node test; preserve the actual receipt and disabled button.
vi.mock("@heroui/react", () => {
  const Container = ({ children, className }: { children?: ReactNode; className?: string }) => <div className={className}>{children}</div>;
  return {
    Modal: Object.assign(Container, { Backdrop: Container, Container, Dialog: Container, Header: Container, Heading: Container, Body: Container, Footer: Container, CloseTrigger: Container }),
    Button: ({ children, isDisabled, onPress }: { children?: ReactNode; isDisabled?: boolean; onPress?: () => void }) => <button disabled={isDisabled} onClick={onPress}>{children}</button>,
  };
});
import { InvoicePreviewModal } from "./InvoicePreviewModal";

function render(overrides: Partial<CheckoutInvoice> = {}) {
  const invoice = { ...initialCheckoutInvoice, paymentMethod: "visa" as const, ...overrides };
  return renderToStaticMarkup(<NextIntlClientProvider locale="vi" messages={messages} timeZone="Asia/Tokyo"><InvoicePreviewModal invoice={invoice} branchId="appointment-branch" totals={calculatePaymentTotals(invoice)} onClose={() => {}} /></NextIntlClientProvider>);
}

describe("invoice branch receipt", () => {
  it("shows the appointment branch name/address alongside the customer and method", () => {
    branchLookup.mockReturnValue({ data: { id: "appointment-branch", name: "HIRO", address: "広島市中区袋町 3番 11号" }, isLoading: false });
    const markup = render();
    expect(branchLookup).toHaveBeenCalledWith("appointment-branch");
    expect(markup).toContain("HIRO");
    expect(markup).toContain("広島市中区袋町 3番 11号");
    expect(markup).toContain(initialCheckoutInvoice.customer.name);
    expect(markup).toContain("VISA");
    expect(markup).not.toContain("disabled");
    expect(markup).toContain('class="invoice-print"');
  });

  it("keeps every line and the final note inside the printable receipt for long invoices", () => {
    branchLookup.mockReturnValue({ data: { id: "appointment-branch", name: "HIRO", address: "Receipt address" }, isLoading: false });
    const additionalItems = Array.from({ length: 50 }, (_, index) => ({ id: String(index), name: `Long receipt item ${index}`, price: 100, note: "", source: "catalog" as const }));
    const markup = render({ additionalItems, orderNote: "FINAL RECEIPT NOTE" });
    expect(markup.match(/Long receipt item /g)).toHaveLength(50);
    expect(markup).toContain("Long receipt item 49");
    expect(markup).toContain("FINAL RECEIPT NOTE");
    expect(markup).toContain("print:hidden");
  });

  it("scopes print isolation to the invoice portal and removes all HeroUI clipping layers", () => {
    const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8");
    const print = css.slice(css.lastIndexOf("@media print"));
    expect(print).toContain("body:has(.invoice-print) *:not(:has(.invoice-print)):not(.invoice-print):not(.invoice-print *)");
    expect(print).toMatch(/display:\s*none !important/);
    for (const slot of ["modal-container", "modal-dialog", "modal-body"]) expect(print).toContain(`.invoice-print [data-slot="${slot}"]`);
    for (const rule of ["position: static", "height: auto", "max-height: none", "overflow: visible", "transform: none", "display: block"]) expect(print).toContain(`${rule} !important`);
    expect(print).toMatch(/\.invoice-print \*\s*\{\s*color: black !important;\s*background: transparent !important;/);
    expect(print).not.toMatch(/(?:^|\n)\s*(?:body|html|\*)\s*\{/);
  });

  it.each([
    { isLoading: true },
    { isLoading: false, error: new Error("Branch request failed") },
    { isLoading: false, data: { id: "other-branch", name: "Other", address: "Other address" } },
    { isLoading: false, data: { id: "appointment-branch", name: "HIRO", address: "" } },
  ])("does not render a printable receipt until the correct complete branch loads", (state) => {
    branchLookup.mockReturnValue(state);
    const markup = render();
    expect(markup).toContain('disabled=""');
    expect(markup).not.toContain(initialCheckoutInvoice.customer.name);
    expect(markup).not.toContain("Other address");
    expect(markup).not.toContain('class="invoice-print"');
    expect(markup).toContain(state.isLoading ? 'role="status"' : 'role="alert"');
  });
});
