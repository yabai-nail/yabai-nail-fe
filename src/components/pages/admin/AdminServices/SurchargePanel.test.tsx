import type { ReactElement, ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AdminSurcharge } from "@/service";

const harness = vi.hoisted(() => ({ states: [] as unknown[], next: 0, create: vi.fn(), update: vi.fn() }));
vi.mock("react", async (load) => ({ ...await load<typeof import("react")>(), useState: () => [harness.states[harness.next++], vi.fn()] }));
vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));
vi.mock("@heroui/react", () => ({ Button: "button", Card: "article", Modal: Object.assign("dialog", { Backdrop: "backdrop", Container: "container", Dialog: "dialog", Header: "header", Heading: "h1", Body: "main", Footer: "footer" }) }));
vi.mock("@/lib/app-toast", () => ({ notifySuccess: vi.fn() }));
vi.mock("@/service", () => ({ adminService: { createSurcharge: harness.create, updateSurcharge: harness.update }, useAdminSurcharges: vi.fn() }));
import { SurchargeEditor } from "./SurchargePanel";

type Element = ReactElement<{ children?: ReactNode; onPress?: () => void; isDisabled?: boolean; role?: string }>;
function find(node: ReactNode, predicate: (node: Element) => boolean): Element | undefined {
  if (Array.isArray(node)) return node.map((child) => find(child, predicate)).find(Boolean);
  if (node && typeof node === "object" && "props" in node) {
    const element = node as Element;
    return predicate(element) ? element : find(element.props.children, predicate);
  }
}
function render(edit: boolean, kind: string, amount: string, percent: string) {
  harness.next = 0;
  harness.states = ["SURCHARGE", "Test surcharge", kind, amount, percent, true, false, null];
  const tree = SurchargeEditor({ surcharge: edit ? { id: "surcharge", version: 3 } as AdminSurcharge : null, onClose: vi.fn(), onSaved: vi.fn() });
  return { tree, button: find(tree, (node) => node.props.children === (edit ? "surcharge.save" : "surcharge.addAction"))! };
}
beforeEach(() => { vi.clearAllMocks(); harness.create.mockResolvedValue({}); harness.update.mockResolvedValue({}); });

describe.each([false, true])("surcharge editor edit=%s", (edit) => {
  it.each(["-1", "1.5", "abc", "1e3", "0", "", " "])("rejects fixed amount %s without mutations", async (amount) => {
    const { tree, button } = render(edit, "FIXED", amount, "10");
    expect(button.props.isDisabled).toBe(true);
    button.props.onPress!(); await Promise.resolve();
    expect(harness.create).not.toHaveBeenCalled(); expect(harness.update).not.toHaveBeenCalled();
    if (amount !== "") expect(find(tree, (node) => node.props.role === "alert")?.props.children).toBe("surcharge.amountInvalid");
  });
  it.each([["300", 300], ["1,500", 1500], ["¥1.500", 1500]])("preserves valid fixed amount %s", async (amount, expected) => {
    const { button } = render(edit, "FIXED", String(amount), "");
    expect(button.props.isDisabled).toBe(false); button.props.onPress!(); await Promise.resolve();
    const payload = edit ? harness.update.mock.calls[0][1] : harness.create.mock.calls[0][0];
    expect(payload).toMatchObject({ type: "FIXED", amount: expected }); expect(payload).not.toHaveProperty("percent");
  });
  it.each(["-1", "0", "101", "Infinity", "abc", ""])("rejects invalid percentage %s", async (percent) => {
    const { button } = render(edit, "PERCENT", "300", percent);
    expect(button.props.isDisabled).toBe(true); button.props.onPress!(); await Promise.resolve();
    expect(harness.create).not.toHaveBeenCalled(); expect(harness.update).not.toHaveBeenCalled();
  });
  it.each(["0.5", "12.5", "100"])("preserves valid fractional percentage %s", async (percent) => {
    const { button } = render(edit, "PERCENT", "invalid unused amount", percent);
    expect(button.props.isDisabled).toBe(false); button.props.onPress!(); await Promise.resolve();
    const payload = edit ? harness.update.mock.calls[0][1] : harness.create.mock.calls[0][0];
    expect(payload).toMatchObject({ type: "PERCENT", percent: Number(percent) }); expect(payload).not.toHaveProperty("amount");
  });
});
