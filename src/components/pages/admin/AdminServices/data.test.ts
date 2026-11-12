import { describe, expect, it } from "vitest";
import {
  filterServices,
  NO_COLUMN_FILTERS,
  UNCATEGORIZED,
  selectAddonServices,
  selectBaseServices,
  getPopularServices,
  getPopularityWindow,
  paginate,
  salonServices,
  sortServices,
  pinnedFirst,
  hasColumnFilters,
  listServices,
  SERVICE_PAGE_SIZE,
} from "./data";

describe("listServices", () => {
  const view = { query: "", filters: NO_COLUMN_FILTERS, sort: null, page: 1 };

  it("pages the whole list and reports the total", () => {
    const first = listServices(salonServices, view);
    expect(first.items).toHaveLength(SERVICE_PAGE_SIZE);
    expect(first).toMatchObject({ page: 1, pageCount: 2, total: salonServices.length });
    expect(listServices(salonServices, { ...view, page: 2 }).items).toHaveLength(salonServices.length - SERVICE_PAGE_SIZE);
  });

  // Search, filter and sort run before paging, so they cover every page, not just the one shown.
  it("searches, filters and sorts before paging", () => {
    const combos = listServices(salonServices, { ...view, query: "combo", sort: { key: "price", direction: "desc" } });
    expect(combos.items.map((service) => service.id)).toEqual(["sv14", "sv13"]);
    expect(combos.total).toBe(2);
    expect(listServices(salonServices, { ...view, filters: { ...NO_COLUMN_FILTERS, statuses: ["hidden"] } }).total).toBe(1);
  });

  it("puts pinned services on the first page only when asked", () => {
    const rows = salonServices.map((service) => (service.id === "sv14" ? { ...service, isPinned: true } : service));
    expect(listServices(rows, view, { pinned: true }).items[0]?.id).toBe("sv14");
    expect(listServices(rows, view).items[0]?.id).toBe("sv1");
  });
});

describe("hasColumnFilters", () => {
  it("is true as soon as any column is filtered", () => {
    expect(hasColumnFilters(NO_COLUMN_FILTERS)).toBe(false);
    expect(hasColumnFilters({ ...NO_COLUMN_FILTERS, groups: ["ART"] })).toBe(true);
    expect(hasColumnFilters({ ...NO_COLUMN_FILTERS, statuses: ["visible"] })).toBe(true);
  });
});

describe("sortServices", () => {
  const ids = (rows: ReadonlyArray<{ readonly id: string }>) => rows.map((row) => row.id);

  it("keeps the API order when no column is chosen", () => {
    expect(ids(sortServices(salonServices, null))).toEqual(ids(salonServices));
  });

  it("orders by price both ways, ties by name", () => {
    const ascending = sortServices(salonServices, { key: "price", direction: "asc" });
    expect(ids(ascending).slice(0, 2)).toEqual(["sv12", "sv11"]);
    expect(ascending.at(-1)?.id).toBe("sv14");
    expect(ids(sortServices(salonServices, { key: "price", direction: "desc" }))[0]).toBe("sv14");
  });

  it("orders by name", () => {
    expect(sortServices(salonServices, { key: "name", direction: "asc" })[0]?.id).toBe("sv13");
  });

  it("orders by duration and by 90-day bookings", () => {
    expect(sortServices(salonServices, { key: "duration", direction: "desc" })[0]?.id).toBe("sv14");
    expect(sortServices(salonServices, { key: "soldCount", direction: "desc" })[0]?.id).toBe("sv2");
  });

  it("groups by category name, with uncategorized rows last", () => {
    const rows = [
      { ...salonServices[0]!, id: "x", category: null },
      ...salonServices.slice(0, 3),
      salonServices[12]!,
    ];
    expect(ids(sortServices(rows, { key: "category", direction: "asc" }))).toEqual(["sv13", "sv1", "sv2", "sv3", "x"]);
  });

  it("puts visible services first, then hidden, and the reverse", () => {
    expect(sortServices(salonServices, { key: "status", direction: "asc" }).at(-1)?.id).toBe("sv14");
    expect(sortServices(salonServices, { key: "status", direction: "desc" })[0]?.id).toBe("sv14");
  });

  it("keeps pinned services on top under any order, each side keeping that order", () => {
    const rows = salonServices.map((service) => (service.id === "sv14" || service.id === "sv12" ? { ...service, isPinned: true } : service));

    expect(ids(pinnedFirst(sortServices(rows, null)))).toEqual(["sv12", "sv14", ...ids(salonServices).filter((id) => id !== "sv12" && id !== "sv14")]);
    const byPrice = ids(pinnedFirst(sortServices(rows, { key: "price", direction: "asc" })));
    expect(byPrice.slice(0, 2)).toEqual(["sv12", "sv14"]);
    expect(byPrice[2]).toBe("sv11");
  });

  it("does not mutate the input", () => {
    const before = ids(salonServices);
    sortServices(salonServices, { key: "price", direction: "desc" });
    expect(ids(salonServices)).toEqual(before);
  });
});

describe("service list derivation", () => {
  it("filters services by the category the backend assigned them", () => {
    const result = filterServices(salonServices, { ...NO_COLUMN_FILTERS, categories: ["cat-addon"] }, "charm");

    expect(result.map((service) => service.id)).toEqual(["sv12"]);
  });

  it("keeps every category when no category is ticked", () => {
    const ids = filterServices(salonServices, NO_COLUMN_FILTERS, "combo").map((service) => service.id);

    expect(ids).toEqual(["sv13", "sv14"]);
  });

  it("matches any of several ticked categories", () => {
    const ids = filterServices(salonServices, { ...NO_COLUMN_FILTERS, categories: ["cat-addon", "cat-combo"] }, "").map((service) => service.id);

    expect(ids).toEqual(["sv9", "sv10", "sv11", "sv12", "sv13", "sv14"]);
  });

  it("finds an unfiled service only through its own filter option", () => {
    // A service only lacks a category if its row predates the NOT NULL column, so a real
    // category must not pretend it belongs there; "uncategorized" is how an admin finds it.
    const unfiled = { ...salonServices[0], id: "sv-unfiled", category: null };
    const pool = [...salonServices, unfiled];
    const ids = (categories: ReadonlyArray<string>) =>
      filterServices(pool, { ...NO_COLUMN_FILTERS, categories }, "").map((service) => service.id);

    expect(ids([])).toContain("sv-unfiled");
    expect(ids(["cat-primary"])).not.toContain("sv-unfiled");
    expect(ids([UNCATEGORIZED])).toEqual(["sv-unfiled"]);
  });

  it("filters add-ons by group, an ungrouped one counting as OTHER", () => {
    const addons = [
      { ...salonServices[8]!, id: "a1", serviceType: "ADD_ON" as const, addonGroup: "REMOVAL" },
      { ...salonServices[9]!, id: "a2", serviceType: "ADD_ON" as const, addonGroup: "ART" },
      { ...salonServices[10]!, id: "a3", serviceType: "ADD_ON" as const, addonGroup: null },
    ];
    const ids = (groups: ReadonlyArray<string>) =>
      filterServices(addons, { ...NO_COLUMN_FILTERS, groups }, "").map((service) => service.id);

    expect(ids([])).toEqual(["a1", "a2", "a3"]);
    expect(ids(["ART"])).toEqual(["a2"]);
    expect(ids(["OTHER", "REMOVAL"])).toEqual(["a1", "a3"]);
  });

  it("orders add-ons by group code", () => {
    const addons = [
      { ...salonServices[8]!, id: "a1", addonGroup: "REMOVAL" },
      { ...salonServices[9]!, id: "a2", addonGroup: "ART" },
    ];
    expect(sortServices(addons, { key: "group", direction: "asc" }).map((service) => service.id)).toEqual(["a2", "a1"]);
  });

  it("filters by visibility", () => {
    const ids = (statuses: ReadonlyArray<"visible" | "hidden">) =>
      filterServices(salonServices, { ...NO_COLUMN_FILTERS, statuses }, "").map((service) => service.id);

    expect(ids(["hidden"])).toEqual(["sv14"]);
    expect(ids(["visible"])).not.toContain("sv14");
    expect(ids(["visible", "hidden"])).toHaveLength(salonServices.length);
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

describe("splitting the catalogue by service type", () => {
  const rows = [
    { ...salonServices[0], id: "base-1", serviceType: "BASE" as const },
    { ...salonServices[0], id: "addon-1", serviceType: "ADD_ON" as const },
    // A row from before the column existed reads as a base service, never as an add-on.
    { ...salonServices[0], id: "legacy", serviceType: undefined },
  ];

  it("keeps add-ons out of the service list", () => {
    expect(selectBaseServices(rows).map((service) => service.id)).toEqual(["base-1", "legacy"]);
  });

  it("returns only add-ons for their own tab", () => {
    expect(selectAddonServices(rows).map((service) => service.id)).toEqual(["addon-1"]);
  });
});
