import { describe, expect, it } from "vitest";

import type { BranchServiceAddonGroup } from "@/service";

import {
  buildPublicAppointmentInput,
  summarisePublicAddonSelection,
  togglePublicAddonSelection,
} from "./public-booking-addons";

const requiredGroup: BranchServiceAddonGroup = {
  code: "finish",
  nameVi: "Lớp phủ",
  selectionMode: "SINGLE",
  required: true,
  minSelections: 0,
  maxSelections: 1,
  options: [
    {
      id: "off-service",
      serviceId: "off-service",
      code: "OFF",
      name: "Không phủ",
      price: 0,
      durationMinutes: 0,
      representsNoSelection: true,
      available: true,
    },
    {
      id: "gloss-service",
      serviceId: "gloss-service",
      code: "GLOSS",
      name: "Phủ bóng",
      price: 1500,
      durationMinutes: 20,
      available: true,
    },
    {
      id: "unavailable-service",
      serviceId: "unavailable-service",
      code: "MATT",
      name: "Phủ lì",
      price: 900,
      durationMinutes: 10,
      available: false,
      unavailableReason: "NO_ELIGIBLE_STAFF",
    },
  ],
};

describe("public booking add-ons", () => {
  it("requires an explicit selection for a required group, including OFF", () => {
    expect(summarisePublicAddonSelection([requiredGroup], []).complete).toBe(false);

    const selected = togglePublicAddonSelection([requiredGroup], "finish", "off-service", []);
    expect(summarisePublicAddonSelection([requiredGroup], selected)).toEqual({
      selectedServiceIds: ["off-service"],
      addedPrice: 0,
      addedMinutes: 0,
      complete: true,
    });
  });

  it("ignores unavailable options and uses branch-effective price and duration", () => {
    expect(
      togglePublicAddonSelection([requiredGroup], "finish", "unavailable-service", []),
    ).toEqual([]);

    const summary = summarisePublicAddonSelection([requiredGroup], ["gloss-service"]);
    expect(summary).toMatchObject({ addedPrice: 1500, addedMinutes: 20, complete: true });
  });

  it("replaces the previous choice in a single-select group", () => {
    expect(
      togglePublicAddonSelection(
        [requiredGroup],
        "finish",
        "gloss-service",
        ["off-service"],
      ),
    ).toEqual(["gloss-service"]);
  });

  it("enforces the minimum and maximum of a multiple-select group", () => {
    const multiple: BranchServiceAddonGroup = {
      ...requiredGroup,
      code: "art",
      selectionMode: "MULTIPLE",
      minSelections: 2,
      maxSelections: 2,
      options: requiredGroup.options.map((option) => ({
        ...option,
        available: true,
        representsNoSelection: false,
      })),
    };

    expect(summarisePublicAddonSelection([multiple], ["off-service"]).complete).toBe(false);
    expect(
      summarisePublicAddonSelection([multiple], ["gloss-service", "unavailable-service"])
        .complete,
    ).toBe(true);
    expect(
      togglePublicAddonSelection(
        [multiple],
        "art",
        "off-service",
        ["gloss-service", "unavailable-service"],
      ),
    ).toEqual(["gloss-service", "unavailable-service"]);
  });

  it("puts selected option service IDs into the appointment payload", () => {
    expect(
      buildPublicAppointmentInput("base-service", ["off-service"], {
        branchId: "branch-1",
        staffId: null,
        startsAt: "2026-09-22T03:00:00.000Z",
        customer: { displayName: "Mai", phone: "0901234567" },
      }),
    ).toEqual({
      branchId: "branch-1",
      serviceIds: ["base-service", "off-service"],
      staffId: null,
      startsAt: "2026-09-22T03:00:00.000Z",
      customer: { displayName: "Mai", phone: "0901234567" },
    });
  });
});
