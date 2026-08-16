import { describe, expect, it } from "vitest";
import { filterServices, paginateServices, salonServices } from "./data";

describe("service list derivation", () => {
  it("filters services by category and normalized query", () => {
    const result = filterServices(salonServices, "addon", "charm");

    expect(result.map((service) => service.id)).toEqual(["sv12"]);
  });

  it("returns the requested page without mutating the source list", () => {
    const originalIds = salonServices.map((service) => service.id);
    const result = paginateServices(salonServices, 2, 8);

    expect(result.items).toHaveLength(6);
    expect(result.page).toBe(2);
    expect(result.pageCount).toBe(2);
    expect(salonServices.map((service) => service.id)).toEqual(originalIds);
  });

  it("clamps a page beyond the available range", () => {
    const result = paginateServices(salonServices.slice(0, 2), 4, 8);

    expect(result.page).toBe(1);
    expect(result.items).toHaveLength(2);
  });
});
