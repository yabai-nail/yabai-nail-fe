import { describe, expect, it } from "vitest";

import type { AdminServiceAddonGroup } from "@/service";
import { shouldKeepAddonGroup, toggleAppointmentAddonSelection } from "./AppointmentAddonPicker";

const group = {
  code: "FINISH",
  selectionMode: "SINGLE",
  required: true,
  minSelections: 1,
  maxSelections: 1,
  items: ["old", "new"].map((id, sortOrder) => ({
    ruleId: `rule-${id}`,
    addonServiceId: id,
    sortOrder,
    addon: { id, name: id, price: 100, durationMinutes: 5, serviceType: "ADD_ON", active: true, version: 1 },
    branches: [],
  })),
} satisfies AdminServiceAddonGroup;

describe("toggleAppointmentAddonSelection", () => {
  it("replaces a SINGLE selection while preserving selections from other groups", () => {
    expect(toggleAppointmentAddonSelection(group, "new", ["old", "other-group"])).toEqual(["other-group", "new"]);
  });

  it("keeps an empty required group incomplete but drops an empty optional group", () => {
    expect(shouldKeepAddonGroup({ ...group, items: [] })).toBe(true);
    expect(shouldKeepAddonGroup({ ...group, required: false, minSelections: 0, items: [] })).toBe(false);
  });
});
