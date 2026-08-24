import { describe, expect, it } from "vitest";

import {
  campaignStatusLabel,
  formatCount,
  isCancellableStatus,
  metricRows,
  parseAudienceDefinition,
} from "./normalize";

describe("parseAudienceDefinition", () => {
  it("accepts a plain JSON object", () => {
    const result = parseAudienceDefinition('{ "tier": "gold" }');
    expect(result).toEqual({ ok: true, value: { tier: "gold" } });
  });

  it("accepts an empty object", () => {
    expect(parseAudienceDefinition("{}")).toEqual({ ok: true, value: {} });
  });

  it("rejects blank input", () => {
    const result = parseAudienceDefinition("   ");
    expect(result.ok).toBe(false);
  });

  it("rejects malformed JSON", () => {
    const result = parseAudienceDefinition("{ tier: gold");
    expect(result.ok).toBe(false);
  });

  it("rejects arrays and primitives", () => {
    expect(parseAudienceDefinition("[]").ok).toBe(false);
    expect(parseAudienceDefinition("42").ok).toBe(false);
    expect(parseAudienceDefinition("null").ok).toBe(false);
    expect(parseAudienceDefinition('"x"').ok).toBe(false);
  });
});

describe("formatCount", () => {
  it("formats finite numbers with grouping", () => {
    expect(formatCount(12345)).toBe("12.345");
  });

  it("returns a dash for non-finite values", () => {
    expect(formatCount(Number.NaN)).toBe("—");
  });
});

describe("campaignStatusLabel", () => {
  it("maps known statuses to Vietnamese", () => {
    expect(campaignStatusLabel("scheduled")).toBe("Đã lên lịch");
    expect(campaignStatusLabel("SENT")).toBe("Đã gửi");
  });

  it("passes through unknown statuses and handles undefined", () => {
    expect(campaignStatusLabel("weird")).toBe("weird");
    expect(campaignStatusLabel(undefined)).toBe("Không rõ");
  });
});

describe("isCancellableStatus", () => {
  it("allows pending-like states", () => {
    expect(isCancellableStatus("scheduled")).toBe(true);
    expect(isCancellableStatus("pending")).toBe(true);
    expect(isCancellableStatus(undefined)).toBe(true);
  });

  it("blocks terminal states", () => {
    expect(isCancellableStatus("sent")).toBe(false);
    expect(isCancellableStatus("Cancelled")).toBe(false);
    expect(isCancellableStatus("failed")).toBe(false);
  });
});

describe("metricRows", () => {
  it("orders known metrics and appends extra numeric fields", () => {
    const rows = metricRows({
      campaignId: "c1",
      delivered: 100,
      opened: 40,
      clicked: 10,
      failed: 2,
      bounced: 5,
      note: "ignored",
    });
    expect(rows.map((row) => row.label)).toEqual([
      "Đã gửi",
      "Đã mở",
      "Đã bấm",
      "Thất bại",
      "bounced",
    ]);
    expect(rows[0]).toEqual({ label: "Đã gửi", value: "100" });
  });

  it("returns an empty list when metrics are absent", () => {
    expect(metricRows(undefined)).toEqual([]);
  });
});
