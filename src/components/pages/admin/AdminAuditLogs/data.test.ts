import { describe, expect, it } from "vitest";
import type { Translator } from "@/i18n/config";
import {
  adaptAuditLog,
  auditActions,
  auditEntries,
  filterAuditEntries,
  formatAuditTime,
  paginate,
} from "./data";

/** The keys this stub admits; anything else falls through to the raw code, as in production. */
const KNOWN = new Set(["role.OWNER", "resource.Customer", "resource.Appointment", "resource.AuthSession"]);

/**
 * Echoes the key it was handed. These tests are about the adapter reaching for the right
 * key and about the fallbacks when a lookup misses; what a key reads as in three languages
 * is the catalogue's business, and key parity guards that.
 */
const t = Object.assign((key: string) => key, {
  has: (key: string) => KNOWN.has(key),
}) as unknown as Translator;

describe("audit log derivation", () => {
  it("filters by action code and normalized query across fields", () => {
    const byAction = filterAuditEntries(auditEntries, "", "PAYMENT_CAPTURED", t);
    expect(byAction.map((entry) => entry.id)).toEqual(["al2"]);

    const byQuery = filterAuditEntries(auditEntries, "yuki", "all", t);
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
    const row = adaptAuditLog(
      {
        id: "x1",
        action: "CUSTOMER_UPDATED",
        actorId: "user-9",
        resourceType: "Customer",
        resourceId: "CU-1",
        createdAt: "2026-08-24T00:00:00.000Z",
      },
      {},
      t,
    );
    expect(row).toMatchObject({
      id: "x1",
      action: "CUSTOMER_UPDATED",
      actor: "unknownAccount",
      target: "resource.Customer",
      branch: undefined,
    });
  });

  it("resolves actor and branch ids through the lookups", () => {
    const actorId = "a11ceafc-9c7d-4d6e-b712-58ad27b9eb64";
    const branchId = "7f8aed1f-c4aa-4b53-97ef-8615b455db87";
    const row = adaptAuditLog(
      {
        id: "x2",
        action: "APPOINTMENT_CHECKED_IN",
        actorId,
        resourceType: "Appointment",
        resourceId: "3339ad7c-22b7-4540-8916-4dc5c8271935",
        metadata: { branchId },
        createdAt: "2026-08-25T16:23:18.974Z",
      },
      {
        accounts: new Map([[actorId, { displayName: "Chu chuoi YABAI", role: "OWNER" }]]),
        branches: new Map([[branchId, { name: "Thảo Điền" }]]),
      },
      t,
    );
    expect(row).toMatchObject({
      actor: "role.OWNER · Chu chuoi YABAI",
      target: "resource.Appointment",
      branch: "Thảo Điền",
    });
  });

  it("uses semantic labels instead of unresolved uuids", () => {
    const actorId = "a11ceafc-9c7d-4d6e-b712-58ad27b9eb64";
    const row = adaptAuditLog(
      {
        id: "x3",
        action: "REFRESH_TOKEN_REUSE_DETECTED",
        actorId,
        resourceType: "AuthSession",
        resourceId: "fc16bbb8-a5f4-48cc-a0cf-bce574c24b8b",
        metadata: { tokenFamilyId: "d451e5e9-3a69-4303-bfe3-7c6fde99fea2" },
        createdAt: "2026-08-25T17:14:33.853Z",
      },
      {},
      t,
    );
    expect(row).toMatchObject({
      actor: "unknownAccount",
      target: "resource.AuthSession",
      branch: undefined,
    });
  });

  it("falls back to the resource type when the catalogue has no name for it", () => {
    const row = adaptAuditLog(
      { id: "x4", action: "WEBHOOK_RECEIVED", resourceType: "Webhook", createdAt: "2026-08-25T18:00:00.000Z" },
      {},
      t,
    );
    expect(row).toMatchObject({ actor: "system", target: "Webhook" });
  });

  it("returns the raw string when the timestamp is unparseable", () => {
    expect(formatAuditTime("not-a-date")).toBe("not-a-date");
  });
});
