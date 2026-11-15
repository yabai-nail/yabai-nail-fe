import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";

const harness = vi.hoisted(() => ({ states: [] as unknown[], setters: [] as ReturnType<typeof vi.fn>[], next: 0, mutate: vi.fn() }));
vi.mock("react", async (load) => ({
  ...await load<typeof import("react")>(),
  useState: (initial: unknown) => {
    const index = harness.next++;
    const setter = vi.fn();
    harness.setters[index] = setter;
    return [index in harness.states ? harness.states[index] : initial, setter];
  },
  useCallback: (fn: unknown) => fn,
}));
vi.mock("swr", () => ({ useSWRConfig: () => ({ mutate: harness.mutate }) }));
vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));

import { ApiClientError, useRevalidatePriceTierDependents, type AdminPriceTier } from "@/service";
import { useServicePriceDraft } from "./useServicePriceDraft";

const tiers: ReadonlyArray<AdminPriceTier> = [{ id: "t1", name: "6600", amount: 6600, designCount: 0, serviceCount: 1, version: 1 }];
const draft = (states: unknown[], options: Partial<Parameters<typeof useServicePriceDraft>[0]> = {}) => {
  harness.next = 0;
  harness.states = states;
  harness.setters = [];
  // React is mocked above, so the hook runs as a plain function here.
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return useServicePriceDraft({
    tiers,
    tierStatus: "ready",
    stored: { price: 6600, priceTierId: "t1" },
    serviceType: "BASE",
    representsNoSelection: false,
    onTiersStale: vi.fn(),
    ...options,
  });
};
// useState order in the hook: mode, tierId, price, tierError.
const [MODE, , PRICE] = [0, 1, 2];

beforeEach(() => vi.clearAllMocks());

describe("service price draft", () => {
  it("opens a linked service on its tier and saves only the tier id", () => {
    const result = draft([]);
    expect(result.fields.mode).toBe("tier");
    expect(result.ready).toBe(true);
    expect(result.payload()).toEqual({ priceTierId: "t1" });
  });

  it("detaching keeps the tier's amount as the typed price", () => {
    const linked = draft([]);
    linked.fields.onModeChange("custom");
    expect(harness.setters[PRICE]).toHaveBeenCalledWith("6600");
    expect(harness.setters[MODE]).toHaveBeenCalledWith("custom");
    expect(draft(["custom", "t1", "6600"]).payload()).toEqual({ priceTierId: null, price: 6600 });
  });

  it("starts a new service on a typed price", () => {
    const result = draft([], { stored: undefined });
    expect(result.fields.mode).toBe("custom");
    expect(result.ready).toBe(false);
    expect(draft(["custom", "", "4400"], { stored: undefined }).payload()).toEqual({ price: 4400 });
  });

  it("forces a typed price on the no-selection add-on, and detaches it if it was linked", () => {
    const result = draft([], { serviceType: "ADD_ON", representsNoSelection: true, stored: { price: 0, priceTierId: "t1" } });
    expect(result.fields.mode).toBe("custom");
    expect(result.fields.canLink).toBe(false);
    expect(result.payload()).toEqual({ priceTierId: null, price: 0 });
  });

  it("detaches a linked no-selection add-on even without the tier permission", () => {
    const result = draft(["tier", "t1", "0"], { tiers: [], tierStatus: "hidden", serviceType: "ADD_ON", representsNoSelection: true, stored: { price: 6600, priceTierId: "t1" } });
    expect(result.fields.mode).toBe("custom");
    expect(result.payload()).toEqual({ priceTierId: null, price: 0 });
  });

  it("keeps a link untouched when this admin cannot read tiers", () => {
    const result = draft([], { tiers: [], tierStatus: "hidden" });
    expect(result.ready).toBe(true);
    expect(result.payload()).toEqual({});
  });

  it("shows PRICE_TIER_NOT_FOUND on the tier field and reloads the tiers", () => {
    const onTiersStale = vi.fn();
    const result = draft([], { onTiersStale });
    expect(result.explainError(new ApiClientError({ message: "x", code: "PRICE_TIER_NOT_FOUND" }))).toBe(true);
    expect(harness.setters[3]).toHaveBeenCalledWith("price.tierNotFound");
    expect(onTiersStale).toHaveBeenCalled();
    expect(result.explainError(new ApiClientError({ message: "x", code: "VALIDATION_FAILED" }))).toBe(false);
  });
});

describe("tier writes refresh linked prices", () => {
  it("revalidates tiers, designs and services wherever they are cached", () => {
    useRevalidatePriceTierDependents()();
    const filter = harness.mutate.mock.calls[0][0] as (key: unknown) => boolean;
    expect(filter(["backend-operation", "GET /api/v1/admin/price-tiers", undefined, undefined])).toBe(true);
    expect(filter(["backend-paginated-operation", "GET /api/v1/admin/services", undefined, { limit: 100 }])).toBe(true);
    expect(filter(["backend-paginated-operation", "GET /api/v1/admin/nail-designs", undefined, {}])).toBe(true);
    expect(filter(["backend-operation", "GET /api/v1/admin/sales", undefined, undefined])).toBe(false);
    expect(filter("GET /api/v1/admin/services")).toBe(false);
  });

  it("wires the tier panel, counts and the service dialogs together", () => {
    const root = join(process.cwd(), "src", "components", "pages", "admin");
    const panel = readFileSync(join(root, "AdminNailDesigns", "PriceTierPanel.tsx"), "utf8");
    const screen = readFileSync(join(root, "AdminServices", "component.tsx"), "utf8");
    expect(panel).toContain("useRevalidatePriceTierDependents()");
    expect(panel).toContain("tier.serviceCount ?? 0");
    expect(panel).toContain('t("delete.servicesInUse"');
    expect(screen).toContain("<PriceTierPanel");
    expect(screen).toContain("priceTierId: server.priceTierId ?? null");
    for (const dialog of ["ServiceCreateModal.tsx", "ServiceEditModal.tsx"]) {
      const source = readFileSync(join(root, "AdminServices", dialog), "utf8");
      expect(source).toContain("<ServicePriceFields {...priceDraft.fields} />");
      expect(source).toContain("priceDraft.explainError(err)");
    }
  });

  it("has the copy in every locale", () => {
    for (const locale of ["vi", "ja", "en"]) {
      const messages = JSON.parse(readFileSync(join(process.cwd(), "messages", `${locale}.json`), "utf8"));
      expect(messages.admin.services.tiersTab).toBeTruthy();
      expect(Object.keys(messages.admin.services.price)).toEqual(Object.keys(JSON.parse(readFileSync(join(process.cwd(), "messages", "vi.json"), "utf8")).admin.services.price));
      expect(messages.admin.nailDesigns.tiers.columns.services).toBeTruthy();
      expect(messages.admin.nailDesigns.tiers.serviceCount).toContain("{count");
      expect(messages.admin.nailDesigns.tiers.delete.servicesInUse).toContain("{amount}");
    }
  });
});
