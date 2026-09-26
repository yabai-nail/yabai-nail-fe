import type { ReactElement, ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const harness = vi.hoisted(() => ({ states: [] as unknown[], next: 0, save: vi.fn(), data: { baseSalary: 5000, commissionRate: 60, appCommissionRate: 50, version: 2 } }));
vi.mock("react", async (load) => ({ ...await load<typeof import("react")>(), useState: () => [harness.states[harness.next++], vi.fn()] }));
vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));
vi.mock("@heroui/react", () => ({ Button: "button" }));
vi.mock("@/lib/app-toast", () => ({ notifySuccess: vi.fn() }));
vi.mock("@/service", () => ({ adminService: { setStaffCompensation: harness.save }, useAdminPermission: () => true, useStaffCompensation: () => ({ data: harness.data, mutate: vi.fn() }) }));
import { StaffCompensationForm } from "./StaffCompensationForm";

type Element = ReactElement<{ children?: ReactNode; onPress?: () => void; isDisabled?: boolean; role?: string }>;
function find(node: ReactNode, predicate: (node: Element) => boolean): Element | undefined {
  if (Array.isArray(node)) return node.map((child) => find(child, predicate)).find(Boolean);
  if (node && typeof node === "object" && "props" in node) {
    const element = node as Element;
    return predicate(element) ? element : find(element.props.children, predicate);
  }
}
function render(salary: string, rate = "", appRate = "") {
  harness.next = 0; harness.states = [salary, rate, appRate, "2026-10-01", false, null];
  return StaffCompensationForm({ staffId: "staff" });
}
beforeEach(() => { vi.clearAllMocks(); harness.save.mockResolvedValue({}); });
describe("staff base salary validation", () => {
  it.each(["-1", "1.5", "10abc", "abc", "1e3"])("blocks %s without changing its meaning", async (input) => {
    const tree = render(input), button = find(tree, (node) => node.props.children === "compensation.submit")!;
    button.props.onPress!(); await Promise.resolve();
    expect(harness.save).not.toHaveBeenCalled();
    expect(button.props.isDisabled).toBe(true);
    expect(find(tree, (node) => node.props.role === "alert")?.props.children).toBe("compensation.salaryInvalid");
  });
  it.each([["", 5000], ["0", 0], ["¥8,000", 8000], ["8.000", 8000]])("preserves salary %s as %s and unchanged rates", async (input, expected) => {
    const tree = render(input as string), button = find(tree, (node) => node.props.children === "compensation.submit")!;
    expect(button.props.isDisabled).toBe(false); button.props.onPress!(); await Promise.resolve();
    expect(harness.save).toHaveBeenCalledWith("staff", { baseSalary: expected, commissionRate: 60, appCommissionRate: 50, effectiveFrom: "2026-10-01" }, 2);
  });
  it.each([["abc", "50"], ["60", "abc"]])("retains non-finite rate validation %s/%s", async (rate, appRate) => {
    const tree = render("0", rate, appRate), button = find(tree, (node) => node.props.children === "compensation.submit")!;
    expect(button.props.isDisabled).toBe(true); button.props.onPress!(); await Promise.resolve();
    expect(harness.save).not.toHaveBeenCalled();
  });
});
