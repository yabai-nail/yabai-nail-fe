import { describe, expect, it } from "vitest";
import {
  accountFixtures,
  accountRoles,
  accountStatusLabels,
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

  it("adapts a backend account, reading accountStatus (not status)", () => {
    const row = adaptAccount({ id: "a1", phone: "09", displayName: "N", role: "STAFF", accountStatus: "ACTIVE", version: 5 });
    expect(row).toMatchObject({ id: "a1", role: "STAFF", status: "ACTIVE", version: 5 });

    expect(
      adaptAccount({ id: "a2", phone: "08", displayName: "M", role: "STAFF", accountStatus: "DISABLED", version: 1 }).status,
    ).toBe("DISABLED");
  });

  it("labels every status the backend can emit", () => {
    for (const code of ["ACTIVE", "INACTIVE", "DISABLED", "MERGED", "PENDING_DELETION", "DELETED"]) {
      expect(accountStatusLabels[code]).toBeTruthy();
    }
  });

  it("paginates and rejects invalid page size", () => {
    expect(paginate(accountFixtures, 2, 2).page).toBe(2);
    expect(() => paginate(accountFixtures, 1, 0)).toThrow(RangeError);
  });
});
