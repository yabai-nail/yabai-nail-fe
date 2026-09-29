import { describe, expect, it } from "vitest";

import type { AdminServiceAddonConfiguration, AdminServiceItem } from "@/service";
import { initialCheckoutInvoice, paymentServiceCatalog } from "./data";
import { replaceCheckoutService } from "./ServiceCheckoutPanel";
import { selectedCheckoutAddons } from "./ServiceSelectionModal";

describe("replaceCheckoutService", () => {
  it("replaces old add-ons with the selected add-ons for the new base service", () => {
    const addon = { id: "new-addon", name: "New add-on", price: 700, note: "", source: "catalog" as const };
    const result = replaceCheckoutService(
      initialCheckoutInvoice,
      paymentServiceCatalog[0],
      [addon],
    );

    expect(result).toEqual({
      ok: true,
      value: expect.objectContaining({
        currentService: paymentServiceCatalog[0],
        additionalItems: [addon],
      }),
    });
  });

  it("blocks the change instead of silently reducing the manual discount", () => {
    const result = replaceCheckoutService(
      { ...initialCheckoutInvoice, benefitDiscount: 1_000, manualDiscount: 8_000, discount: 9_000 },
      paymentServiceCatalog[0],
      [],
    );

    expect(result).toEqual({ ok: false, error: "state.reduceDiscountBeforeServiceChange" });
  });
});

describe("selectedCheckoutAddons", () => {
  const addon = (id: string, overrides: Partial<AdminServiceItem> = {}) => ({
    id, name: id, price: 500, durationMinutes: 10, serviceType: "ADD_ON" as const, active: true, version: 1, ...overrides,
  });
  const configuration = {
    serviceId: "base",
    version: 1,
    addonCatalog: [],
    branches: [],
    groups: [{
      code: "REMOVAL", selectionMode: "SINGLE" as const, required: true, minSelections: 1, maxSelections: 1,
      items: [
        { ruleId: "r1", addonServiceId: "mapped", sortOrder: 0, addon: addon("mapped"), branches: [{ branchId: "branch", enabled: true, priceOverride: 700, durationOverride: 20 }] },
        { ruleId: "r2", addonServiceId: "disabled", sortOrder: 1, addon: addon("disabled"), branches: [{ branchId: "branch", enabled: false, priceOverride: null, durationOverride: null }] },
      ],
    }],
  } satisfies AdminServiceAddonConfiguration;

  it("materializes only selected branch-enabled add-ons at the branch price", () => {
    expect(selectedCheckoutAddons(configuration, "branch", ["mapped", "disabled"])).toEqual([{
      id: "mapped", name: "mapped", price: 700, note: "", source: "catalog",
    }]);
  });
});
