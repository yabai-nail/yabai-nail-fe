import { describe, expect, it } from "vitest";
import {
  accountFixtures,
  accountRoles,
  adaptAccount,
  filterAccounts,
  paginate,
} from "./data";

describe("account list derivation", () => {
  it("filters by role and query on name/phone", () => {
    expect(filterAccounts(accountFixtures, "STAFF", "").map((a) => a.id)).toEqual(["ac3", "ac4"]);
    expect(filterAccounts(accountFixtures, "all", "0900000002").map((a) => a.id)).toEqual(["ac2"]);
  });

  it("lists distinct roles sorted", () => {
    expect(accountRoles(accountFixtures)).toEqual(["MANAGER", "OWNER", "STAFF"]);
  });

  it("adapts a backend account", () => {
    const row = adaptAccount({ id: "a1", phone: "09", displayName: "N", role: "STAFF", status: "ACTIVE", version: 5 });
    expect(row).toMatchObject({ id: "a1", role: "STAFF", version: 5 });
  });

  it("paginates and rejects invalid page size", () => {
    expect(paginate(accountFixtures, 2, 2).page).toBe(2);
    expect(() => paginate(accountFixtures, 1, 0)).toThrow(RangeError);
  });
});
