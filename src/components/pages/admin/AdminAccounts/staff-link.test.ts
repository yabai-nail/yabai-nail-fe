import { describe, expect, it } from "vitest";
import type { AdminStaffMember } from "@/service";
import { capabilityAreas, staffByAccount, unlinkedStaff } from "./data";

function member(id: string, accountId: string | null): AdminStaffMember {
  return { id, displayName: id, branchId: "b", serviceIds: [], active: true, version: 1, accountId };
}

describe("staffByAccount", () => {
  it("indexes profiles by the login they are linked to, first link wins", () => {
    const index = staffByAccount([member("s1", "acc-1"), member("s2", null), member("s3", "acc-1")]);
    expect(index.get("acc-1")?.id).toBe("s1");
    expect(index.size).toBe(1);
  });

  it("reads the nested account object when the flat id is absent", () => {
    const nested = { ...member("s4", null), account: { id: "acc-4", phone: "0", displayName: "x", role: "STAFF", accountStatus: "ACTIVE" } } as AdminStaffMember;
    expect(staffByAccount([nested]).get("acc-4")?.id).toBe("s4");
  });
});

describe("unlinkedStaff", () => {
  it("keeps only profiles no login points at", () => {
    expect(unlinkedStaff([member("s1", "acc-1"), member("s2", null)]).map((row) => row.id)).toEqual(["s2"]);
  });
});

describe("capabilityAreas", () => {
  it("groups permission codes into console areas, keeping unknown codes as they are", () => {
    expect(capabilityAreas(["sales.report.read.own", "sales.report.write.own", "payroll.read.own", "appointment.read.assigned", "calendar.read.assigned", "made.up"]))
      .toEqual(["salesReports", "payroll", "appointments", "made.up"]);
  });

  it("is empty for a role with no console", () => {
    expect(capabilityAreas([])).toEqual([]);
  });
});
