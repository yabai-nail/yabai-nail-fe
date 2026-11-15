import { describe, expect, it } from "vitest";

import { ApiClientError } from "@/service";

import { canCreateStaff, OPEN_APPOINTMENTS_CODE, searchStaff, sortStaff, STAFF_HAS_HISTORY_CODE, staffDeleteRefusal, staffSaveErrorKey, type StaffMember } from "./data";

function member(id: string, overrides: Partial<StaffMember> = {}): StaffMember {
  return {
    id, name: id, initials: "", phone: "", avatarUrl: null, status: "working",
    revenue: null, refundTotal: null, commissionRate: null, commissionAmount: null, orders: null,
    version: 1, branchId: "branch-a", branchName: null, ...overrides,
  };
}

describe("searchStaff", () => {
  const roster = [member("a", { name: "Mai Linh", phone: "09011112222" }), member("b", { name: "Hoa", phone: "0903334444" })];

  it("matches the name or the phone, and keeps everyone for an empty query", () => {
    expect(searchStaff(roster, "linh").map((row) => row.id)).toEqual(["a"]);
    expect(searchStaff(roster, "0903").map((row) => row.id)).toEqual(["b"]);
    expect(searchStaff(roster, "  ").map((row) => row.id)).toEqual(["a", "b"]);
  });
});

describe("sortStaff", () => {
  const roster = [
    member("a", { name: "Mai", revenue: 50000, orders: 3, commissionRate: 40, commissionAmount: 20000 }),
    member("b", { name: "Hoa", revenue: null, orders: null }),
    member("c", { name: "Lan", revenue: 90000, orders: 5, commissionRate: 30, commissionAmount: 27000 }),
  ];
  const ids = (rows: ReadonlyArray<StaffMember>) => rows.map((row) => row.id);

  it("keeps the roster order with no sort", () => {
    expect(ids(sortStaff(roster, null))).toEqual(["a", "b", "c"]);
  });

  it("orders by name and by each figure both ways", () => {
    expect(ids(sortStaff(roster, { key: "name", direction: "asc" }))).toEqual(["b", "c", "a"]);
    expect(ids(sortStaff(roster, { key: "revenue", direction: "desc" }))).toEqual(["c", "a", "b"]);
    expect(ids(sortStaff(roster, { key: "commissionRate", direction: "asc" }))).toEqual(["c", "a", "b"]);
    expect(ids(sortStaff(roster, { key: "commissionAmount", direction: "desc" }))).toEqual(["c", "a", "b"]);
  });

  // A member with no figure for the period has no value, not zero: keep them after every value.
  it("puts members without a figure last in either direction", () => {
    expect(ids(sortStaff(roster, { key: "orders", direction: "asc" }))).toEqual(["a", "c", "b"]);
    expect(ids(sortStaff(roster, { key: "orders", direction: "desc" }))).toEqual(["c", "a", "b"]);
  });
});

describe("staffDeleteRefusal", () => {
  const refused = (code: string) => new ApiClientError({ message: "Nhan vien da co du lieu", code, status: 409 });

  // These two refusals are expected outcomes the delete dialog explains in its own words.
  it("names the refusals the dialog answers with its own advice", () => {
    expect(staffDeleteRefusal(refused(STAFF_HAS_HISTORY_CODE))).toBe("hasHistory");
    expect(staffDeleteRefusal(refused(OPEN_APPOINTMENTS_CODE))).toBe("openAppointments");
  });

  it("leaves any other failure to its own message", () => {
    expect(staffDeleteRefusal(refused("VERSION_CONFLICT"))).toBeNull();
    expect(staffDeleteRefusal(new Error("network"))).toBeNull();
  });
});

describe("canCreateStaff", () => {
  const complete = {
    name: "Mai Linh",
    withAccount: true,
    phone: "0900000010",
    password: "NewPass1",
  } as const;

  it("wants a name whether or not a login comes with it", () => {
    expect(canCreateStaff({ ...complete, name: "M" })).toBe(false);
    expect(canCreateStaff({ ...complete, name: "M", withAccount: false })).toBe(false);
  });

  // A technician who never opens the console still belongs on the roster.
  it("asks for credentials only when a login is being issued", () => {
    expect(canCreateStaff({ name: "Mai Linh", withAccount: false, phone: "", password: "" })).toBe(true);
    expect(canCreateStaff(complete)).toBe(true);
  });

  // Both requests go out on one press, so a credential the backend would refuse has to stop
  // the form here rather than after the account call has already landed.
  it("holds the form back on a credential the backend would refuse", () => {
    expect(canCreateStaff({ ...complete, phone: "900000010" })).toBe(false);
    expect(canCreateStaff({ ...complete, password: "newpass1" })).toBe(false);
  });
});

describe("staffSaveErrorKey", () => {
  it("names the one refusal the admin can do something about", () => {
    const refused = new ApiClientError({
      message: "Khong the ngung hoac chuyen nhan vien khi con lich hen chua hoan tat.",
      code: OPEN_APPOINTMENTS_CODE,
      status: 409,
    });

    expect(staffSaveErrorKey(refused)).toBe("openAppointments");
  });

  // Every other failure already arrives with a Vietnamese sentence from the backend, and
  // replacing it with a generic one would hide which rule was broken.
  it("leaves every other failure to the message the server sent", () => {
    expect(staffSaveErrorKey(new ApiClientError({ message: "Sai phien ban.", code: "VERSION_CONFLICT" }))).toBeNull();
    expect(staffSaveErrorKey(new Error("boom"))).toBeNull();
    expect(staffSaveErrorKey(null)).toBeNull();
    expect(staffSaveErrorKey("RESOURCE_HAS_OPEN_APPOINTMENTS")).toBeNull();
  });
});
