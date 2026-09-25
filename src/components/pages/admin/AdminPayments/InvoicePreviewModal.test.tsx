import type { ReactNode } from "react";
import { NextIntlClientProvider } from "next-intl";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import messages from "../../../../../messages/vi.json";
import { initialCheckoutInvoice } from "./data";
import { calculatePaymentTotals } from "./payment-state";

const branchLookup = vi.hoisted(() => vi.fn());
vi.mock("@/service", () => ({ useAdminBranchDetail: branchLookup }));
// Render portal contents in the Node test; preserve the actual receipt and disabled button.
vi.mock("@heroui/react", () => {
  const Container = ({ children }: { children?: ReactNode }) => <div>{children}</div>;
  return {
    Modal: Object.assign(Container, { Backdrop: Container, Container, Dialog: Container, Header: Container, Heading: Container, Body: Container, Footer: Container, CloseTrigger: Container }),
    Button: ({ children, isDisabled, onPress }: { children?: ReactNode; isDisabled?: boolean; onPress?: () => void }) => <button disabled={isDisabled} onClick={onPress}>{children}</button>,
  };
});
import { InvoicePreviewModal } from "./InvoicePreviewModal";

function render() {
  const invoice = { ...initialCheckoutInvoice, paymentMethod: "visa" as const };
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
    expect(markup).toContain(state.isLoading ? 'role="status"' : 'role="alert"');
  });
});
