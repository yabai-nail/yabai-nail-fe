import type { ReactElement, ReactNode } from "react";
import { expect, it, vi } from "vitest";

const push = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));
vi.mock("@heroui/react", () => {
  const Box = "div";
  return { Avatar: Object.assign(Box, { Fallback: Box }), Button: "button", Chip: Object.assign(Box, { Label: Box }) };
});
import { CommissionTable } from "./CommissionTable";

type Element = ReactElement<{ children?: ReactNode; onPress?: () => void }>;
function find(node: ReactNode, predicate: (node: Element) => boolean): Element | undefined {
  if (Array.isArray(node)) return node.map((child) => find(child, predicate)).find(Boolean);
  if (node && typeof node === "object" && "props" in node) {
    const element = node as Element;
    return predicate(element) ? element : find(element.props.children, predicate);
  }
}

it("opens the selected staff member in the active branch", () => {
  const tree = CommissionTable({
    branchId: "branch / tenjin",
    policies: [{
      id: "policy-staff",
      staffId: "staff / yuki",
      name: "Yuki",
      initials: "YU",
      roleLabel: null,
      status: "working",
      rate: 10,
      appRate: 5,
      personalRevenue: 10_000,
      refundTotal: 0,
      payout: 1_000,
    }],
  });
  find(tree, (node) => typeof node.props.onPress === "function")?.props.onPress?.();
  expect(push).toHaveBeenCalledWith("/admin/staff?branchId=branch%20%2F%20tenjin&id=staff%20%2F%20yuki");
});
