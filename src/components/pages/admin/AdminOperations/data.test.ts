import { describe, expect, it } from "vitest";
import {
  formatSalonClock,
  formatMoney,
  parseMoney,
  summarizeCheckIn,
  summarizeCustomer,
  summarizeMembership,
} from "./data";

/** Echoes the code back; what a status is called is the catalogue's business. */
const statusLabel = (status: string) => status;

describe("operations helpers", () => {
  it("parses grouped money strings to an integer", () => {
    expect(parseMoney("1.000.000")).toBe(1000000);
    expect(parseMoney("1,250,000 ¥")).toBe(1250000);
    expect(parseMoney("abc")).toBe(0);
  });

  it("formats yen with grouping and symbol", () => {
    expect(formatMoney(50000)).toBe("50.000 ¥");
  });

  it("summarizes a customer, preferring masked phone", () => {
    const hit = summarizeCustomer({ id: "c1", displayName: "An", phoneMasked: "09****01" } as never);
    expect(hit).toEqual({ id: "c1", name: "An", phone: "09****01" });
  });

  it("falls back to dashes when fields are missing", () => {
    const hit = summarizeCustomer({ id: "c2" } as never);
    expect(hit).toEqual({ id: "c2", name: "—", phone: "—" });
  });
});

describe("check-in resolution view", () => {
  const resolution = {
    customer: { id: "c1", displayName: "Test Khach A", phone: "0911000001", tier: "MEMBER", pointBalance: 250 },
    localDate: "2026-08-26",
    todaysAppointments: [
      { id: "a1", customerId: "c1", branchId: "b1", staffId: "s1", serviceIds: ["sv1"], startsAt: "2026-08-26T03:00:00.000Z", endsAt: "2026-08-26T04:00:00.000Z", status: "COMPLETED", total: 250000, discount: 0, version: 5 },
    ],
  } as const;

  it("keeps the customer identity the receptionist needs", () => {
    expect(summarizeCheckIn(resolution, statusLabel).customer).toEqual({
      id: "c1",
      name: "Test Khach A",
      phone: "0911000001",
      tier: "MEMBER",
      points: 250,
    });
  });

  // The view renders salon time, and labels the status through whatever the screen
  // hands it -- naming COMPLETED is the catalogue's job, not this function's.
  it("renders each appointment in salon time with a labelled status", () => {
    expect(summarizeCheckIn(resolution, statusLabel).appointments).toEqual([
      { id: "a1", time: "10:00", status: "COMPLETED", total: 250000 },
    ]);
  });

  it("keeps the day the API resolved, not the browser's", () => {
    expect(summarizeCheckIn(resolution, statusLabel).localDate).toBe("2026-08-26");
  });

  it("survives a day with no appointments", () => {
    const empty = summarizeCheckIn({ ...resolution, todaysAppointments: [] }, statusLabel);
    expect(empty.appointments).toEqual([]);
  });

  it("falls back to dashes when the customer card is sparse", () => {
    const view = summarizeCheckIn({ ...resolution, customer: { id: "c9" } }, statusLabel);
    expect(view.customer).toEqual({ id: "c9", name: "—", phone: "—", tier: "—", points: 0 });
  });
});

describe("membership resolution view", () => {
  it("exposes the resolved customer and timestamp", () => {
    const view = summarizeMembership({
      customer: { id: "c1", displayName: "Test Khach A", phone: "0911000001", tier: "GOLD", pointBalance: 2100 },
      resolvedAt: "2026-08-25T18:01:45.542Z",
    });
    expect(view).toEqual({
      customer: { id: "c1", name: "Test Khach A", phone: "0911000001", tier: "GOLD", points: 2100 },
      resolvedAt: "2026-08-25T18:01:45.542Z",
    });
  });
});

describe("formatSalonClock", () => {
  it("shows the salon wall clock for a UTC instant", () => {
    expect(formatSalonClock("2026-08-26T08:00:00.000Z")).toBe("15:00");
  });

  it("returns a dash for an unparseable instant", () => {
    expect(formatSalonClock("not-a-date")).toBe("—");
  });
});
