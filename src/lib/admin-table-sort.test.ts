import { describe, expect, it } from "vitest";
import { nextAdminTableSort } from "./admin-table-sort";

describe("nextAdminTableSort", () => {
  it("cycles one column through ascending, descending and off", () => {
    const ascending = nextAdminTableSort<"price" | "name">(null, "price");
    expect(ascending).toEqual({ key: "price", direction: "asc" });
    const descending = nextAdminTableSort(ascending, "price");
    expect(descending).toEqual({ key: "price", direction: "desc" });
    expect(nextAdminTableSort(descending, "price")).toBeNull();
  });

  it("starts ascending again when another column is clicked", () => {
    expect(nextAdminTableSort<"price" | "name">({ key: "price", direction: "desc" }, "name")).toEqual({ key: "name", direction: "asc" });
  });
});
