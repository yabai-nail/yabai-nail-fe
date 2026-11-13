import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { AdminSale } from "@/service";

vi.mock("next-intl", () => ({
  useLocale: () => "vi",
  useTranslations: () => (key: string, values?: Record<string, unknown>) => (values ? `${key}(${Object.entries(values).map(([name, value]) => `${name}=${String(value)}`).join(",")})` : key),
}));
vi.mock("@heroui/react", () => {
  const part = (tag: string) =>
    function MockPart({ children, isDisabled, onPress, ...props }: Record<string, unknown> & { children?: ReactNode; isDisabled?: boolean; onPress?: () => void }) {
      return createElement(tag, { ...props, disabled: isDisabled, onClick: onPress }, children);
    };
  return {
    Button: part("button"),
    Card: Object.assign(part("article"), { Content: part("div") }),
    Chip: Object.assign(part("span"), { Label: part("span") }),
    InputGroup: Object.assign(part("div"), { Prefix: part("span"), Input: part("input") }),
  };
});
import { SaleItemPicker } from "./SaleItemPicker";
import { SaleList } from "./SaleList";
import { SalePreview } from "./SalePreview";
import { newSaleForm } from "./data";

const NOW = new Date("2026-11-13T10:00:00+09:00");
const designs = Array.from({ length: 8 }, (_, index) => ({
  id: `d${index}`,
  groupId: "t1",
  name: `Design ${index}`,
  price: index === 0 ? 4000 : 7000,
}));

describe("SalePreview", () => {
  const form = { ...newSaleForm(NOW), ruleValue: "5000", designs: { mode: "ALL" as const, groupIds: [], itemIds: [] } };

  it("lists six items, the total and the rest, and warns when a flat price does not lower one", () => {
    const html = renderToStaticMarkup(createElement(SalePreview, { form, designTargets: designs, serviceTargets: [] }));
    expect(html.match(/<li /g)).toHaveLength(6);
    expect(html).toContain("total(count=8)");
    expect(html).toContain("more(count=2)");
    expect(html).toContain("notCheaper(count=1)");
    expect(html).toContain("keepsPrice");
  });

  it("does not warn for a percent rule", () => {
    const percent = { ...form, ruleType: "PERCENT" as const, ruleValue: "20" };
    const html = renderToStaticMarkup(createElement(SalePreview, { form: percent, designTargets: designs, serviceTargets: [] }));
    expect(html).not.toContain("notCheaper");
  });

  it("asks for a price before previewing", () => {
    const html = renderToStaticMarkup(createElement(SalePreview, { form: { ...form, ruleValue: "" }, designTargets: designs, serviceTargets: [] }));
    expect(html).toContain("needRule");
  });
});

describe("SaleItemPicker", () => {
  it("labels each checkbox with the item name and offers select-all for the shown rows", () => {
    const html = renderToStaticMarkup(
      createElement(SaleItemPicker, {
        label: "pick",
        searchLabel: "search",
        emptyText: "none",
        items: designs.slice(0, 2),
        selected: ["d1"],
        onChange: () => undefined,
      }),
    );
    expect(html).toContain('aria-label="Design 0"');
    expect(html).toContain('aria-label="Design 1"');
    expect(html).toContain("selectAll(count=2)");
    expect(html).toContain("selected(count=1)");
  });
});

describe("SaleList", () => {
  const sale = (id: string, status: AdminSale["status"]): AdminSale => ({
    id,
    name: `Sale ${id}`,
    startsAt: "2026-11-13T01:00:00.000Z",
    endsAt: "2026-11-20T01:00:00.000Z",
    endedAt: null,
    rule: { type: "PERCENT", value: 20 },
    designs: { mode: "ALL", ids: [] },
    services: { mode: "NONE", ids: [] },
    status,
    version: 1,
  });
  const render = (canWrite: boolean) =>
    renderToStaticMarkup(
      createElement(SaleList, {
        sales: [sale("a", "ACTIVE"), sale("b", "ENDED")],
        isLoading: false,
        failed: false,
        designTargets: designs,
        serviceTargets: [],
        canWrite,
        createButton: null,
        onEdit: () => undefined,
        onEnd: () => undefined,
        onDuplicate: () => undefined,
        onDelete: () => undefined,
      }),
    );

  it("shows the status as text, the coverage and the rule", () => {
    const html = render(true);
    expect(html).toContain("status.ACTIVE");
    expect(html).toContain("status.ENDED");
    expect(html).toContain("list.coverageDesigns(count=8)");
    expect(html).toContain("rule.percent(percent=20)");
  });

  it("offers edit and end only on a sale that has not ended", () => {
    const html = render(true);
    expect(html).toContain("list.editLabel(name=Sale a)");
    expect(html).not.toContain("list.editLabel(name=Sale b)");
    expect(html).not.toContain("list.endLabel(name=Sale b)");
    expect(html).toContain("list.duplicateLabel(name=Sale b)");
  });

  it("disables every action without the write permission", () => {
    expect(render(false).match(/<button[^>]*disabled=""/g)).toHaveLength(6);
    expect(render(true)).not.toMatch(/<button[^>]*disabled=""/);
  });
});
