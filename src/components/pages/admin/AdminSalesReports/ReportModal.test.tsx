import type { ReactElement, ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AdminSalesReport } from "@/service";

const harness = vi.hoisted(() => ({ states: [] as unknown[], next: 0, preview: vi.fn(), create: vi.fn(), update: vi.fn() }));
vi.mock("react", async (load) => ({ ...await load<typeof import("react")>(), useState: () => [harness.states[harness.next++], vi.fn()] }));
vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));
vi.mock("@heroui/react", () => ({ Button: "button", Modal: Object.assign("dialog", { Backdrop: "backdrop", Container: "container", Dialog: "dialog", Header: "header", Heading: "h1", Body: "main", Footer: "footer" }) }));
vi.mock("@/lib/app-toast", () => ({ notifySuccess: vi.fn() }));
vi.mock("@/service", () => ({ ApiClientError: class extends Error {}, adminService: { createSalesReport: harness.create, updateSalesReport: harness.update }, useAdminSalesReportPreview: harness.preview }));
import { ReportModal } from "./ReportModal";

type Element = ReactElement<{ children?: ReactNode; onPress?: () => void; isDisabled?: boolean; role?: string }>;
function find(node: ReactNode, predicate: (node: Element) => boolean): Element | undefined {
  if (Array.isArray(node)) return node.map((child) => find(child, predicate)).find(Boolean);
  if (node && typeof node === "object" && "props" in node) {
    const element = node as Element;
    return predicate(element) ? element : find(element.props.children, predicate);
  }
}
function render(edit: boolean, course: string, addon: string) {
  harness.next = 0;
  harness.states = ["staff", "2026-09-26", "10:00", "HOT_PEPPER", course, addon, "CASH", "", false, null];
  return ReportModal({ report: edit ? { id: "report", staffId: "staff", version: 3 } as AdminSalesReport : null, staffOptions: [{ id: "staff", name: "Staff" }], onClose: vi.fn(), onSaved: vi.fn() });
}
beforeEach(() => { vi.clearAllMocks(); harness.preview.mockReturnValue({ data: { grossAmount: 10000, platformFee: 500, staffAmount: 5000, salonAmount: 4500, staffRatePercent: 55 } }); harness.create.mockResolvedValue({}); harness.update.mockResolvedValue({}); });

describe.each([false, true])("shared report form edit=%s", (edit) => {
  it.each([["-1", "2000"], ["1.5", "2000"], ["12abc", "2000"], ["8000", "-1"], ["8000", "2.5"], ["8000", "abc"]])("blocks invalid %s/%s at preview AND submit", async (course, addon) => {
    const tree = render(edit, course, addon), button = find(tree, (node) => node.props.children === (edit ? "save" : "submit"))!;
    expect(harness.preview).toHaveBeenLastCalledWith(null);
    expect(button.props.isDisabled).toBe(true);
    expect(find(tree, (node) => node.props.role === "alert")?.props.children).toBe("amountInvalid");
    button.props.onPress!(); // Guard must hold even if a disabled control's callback is invoked.
    await Promise.resolve();
    expect(harness.create).not.toHaveBeenCalled(); expect(harness.update).not.toHaveBeenCalled();
  });
  it.each([["8,000", "2.000", 8000, 2000], ["0", "", 0, 0]])("preserves valid %s/%s", async (course, addon, expectedCourse, expectedAddon) => {
    const tree = render(edit, course as string, addon as string), button = find(tree, (node) => node.props.children === (edit ? "save" : "submit"))!;
    expect(button.props.isDisabled).toBe(false);
    expect(harness.preview).toHaveBeenLastCalledWith(expect.objectContaining({ coursePrice: expectedCourse, accessoryAmount: expectedAddon }));
    button.props.onPress!(); await Promise.resolve();
    const payload = edit ? harness.update.mock.calls[0][1] : harness.create.mock.calls[0][0];
    expect(payload).toMatchObject({ coursePrice: expectedCourse, accessoryAmount: expectedAddon });
  });
});
