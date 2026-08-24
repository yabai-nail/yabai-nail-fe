import { describe, expect, it } from "vitest";
import {
  adaptAuditLog,
  auditActions,
  auditEntries,
  filterAuditEntries,
  formatAuditTime,
  paginate,
} from "./data";

describe("audit log derivation", () => {
  it("filters by action code and normalized query across fields", () => {
    const byAction = filterAuditEntries(auditEntries, "", "PAYMENT_CAPTURED");
    expect(byAction.map((entry) => entry.id)).toEqual(["al2"]);

    const byQuery = filterAuditEntries(auditEntries, "yuki", "all");
    expect(byQuery.every((entry) => entry.actor.toLowerCase().includes("yuki"))).toBe(true);
    expect(byQuery.length).toBeGreaterThan(1);
  });

  it("lists distinct actions sorted", () => {
    const actions = auditActions(auditEntries);
    expect(actions).toContain("PAYMENT_CAPTURED");
    expect([...actions]).toEqual([...actions].sort());
    expect(new Set(actions).size).toBe(actions.length);
  });

  it("paginates without mutating and clamps out-of-range pages", () => {
    const originalIds = auditEntries.map((entry) => entry.id);
    const result = paginate(auditEntries, 99, 4);
    expect(result.page).toBe(result.pageCount);
    expect(result.items).toHaveLength(auditEntries.length - 4 * (result.pageCount - 1));
    expect(auditEntries.map((entry) => entry.id)).toEqual(originalIds);
  });

  it("rejects an invalid page size", () => {
    expect(() => paginate(auditEntries, 1, 0)).toThrow(RangeError);
  });

  it("adapts a backend log into a display row", () => {
    const row = adaptAuditLog({
      id: "x1",
      action: "CUSTOMER_UPDATED",
      actorId: "user-9",
      actorType: "MANAGER",
      targetType: "Customer",
      targetId: "CU-1",
      createdAt: "2026-08-24T00:00:00.000Z",
    });
    expect(row).toMatchObject({
      id: "x1",
      action: "CUSTOMER_UPDATED",
      actor: "MANAGER · user-9",
      target: "Customer · CU-1",
    });
  });

  it("returns the raw string when the timestamp is unparseable", () => {
    expect(formatAuditTime("not-a-date")).toBe("not-a-date");
  });
});
