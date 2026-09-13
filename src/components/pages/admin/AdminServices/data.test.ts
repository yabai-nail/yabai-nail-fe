import { describe, expect, it } from "vitest";
import {
  filterServices,
  getPopularServices,
  getPopularityWindow,
  paginate,
  salonServices,
} from "./data";

describe("service list derivation", () => {
  it("filters services by the category the backend assigned them", () => {
    const result = filterServices(salonServices, "cat-addon", "charm");

    expect(result.map((service) => service.id)).toEqual(["sv12"]);
  });

  it("keeps every category when the filter is all", () => {
    const ids = filterServices(salonServices, "all", "combo").map((service) => service.id);

    expect(ids).toEqual(["sv13", "sv14"]);
  });

  it("hides an unfiled service from a category tab but not from all", () => {
    // A service only lacks a category if its row predates the NOT NULL column, so the tabs
    // must not pretend it belongs somewhere.
    const unfiled = { ...salonServices[0], id: "sv-unfiled", category: null };
    const pool = [...salonServices, unfiled];

    expect(filterServices(pool, "all", "").map((service) => service.id)).toContain("sv-unfiled");
    expect(filterServices(pool, "cat-primary", "").map((service) => service.id)).not.toContain("sv-unfiled");
  });

  it("returns the requested page without mutating the source list", () => {
    const originalIds = salonServices.map((service) => service.id);
    const result = paginate(salonServices, 2, 8);

    expect(result.items).toHaveLength(6);
    expect(result.page).toBe(2);
    expect(result.pageCount).toBe(2);
    expect(salonServices.map((service) => service.id)).toEqual(originalIds);
  });

  it("clamps a page beyond the available range", () => {
    const result = paginate(salonServices.slice(0, 2), 4, 8);

    expect(result.page).toBe(1);
    expect(result.items).toHaveLength(2);
  });

  it("uses a stable 90-day popularity window", () => {
    expect(getPopularityWindow(new Date("2026-09-13T00:00:00.000Z"))).toEqual({
      from: "2026-06-15T00:00:00.000Z",
      to: "2026-09-13T00:00:00.000Z",
    });
  });

  it("ranks only visible services with enough completed bookings", () => {
    const pool = [
      { ...salonServices[0], id: "low", soldCount: 2 },
      { ...salonServices[0], id: "popular", soldCount: 8 },
      { ...salonServices[0], id: "hidden", soldCount: 20, isVisible: false },
      { ...salonServices[0], id: "second", soldCount: 5 },
    ];

    expect(getPopularServices(pool).map((service) => service.id)).toEqual(["popular", "second"]);
  });
});
