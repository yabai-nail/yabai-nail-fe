import { describe, expect, it } from "vitest";

import {
  MISSING,
  currentMonth,
  exportErrorMessage,
  exportStatusLabel,
  formatCell,
  formatDate,
  formatRangeLabel,
  isReportTabId,
  monthToRange,
  rangeProblem,
  recentMonths,
  reportTabs,
  toColumns,
  toMetricTiles,
  toRows,
  toSegmentTiles,
} from "./normalize";

describe("month to range", () => {
  it("produces the half-open window the backend expects", () => {
    expect(monthToRange("2026-08")).toEqual({ from: "2026-08-01", to: "2026-09-01" });
  });

  it("rolls December into the next year", () => {
    expect(monthToRange("2026-12")).toEqual({ from: "2026-12-01", to: "2027-01-01" });
  });

  it("reads the month off local time, not UTC", () => {
    // A late-evening local date is already the next day in UTC, so a
    // `toISOString` based month would name the wrong month here.
    expect(currentMonth(new Date(2026, 7, 31, 23, 30))).toBe("2026-08");
  });

  it("lists recent months newest first and walks back across a year boundary", () => {
    expect(recentMonths(new Date(2026, 1, 15), 4)).toEqual([
      "2026-02",
      "2026-01",
      "2025-12",
      "2025-11",
    ]);
  });
});

describe("range validation", () => {
  it("accepts a normal month", () => {
    expect(rangeProblem({ from: "2026-08-01", to: "2026-09-01" })).toBeNull();
  });

  it("rejects an end date that is not after the start", () => {
    expect(rangeProblem({ from: "2026-08-01", to: "2026-08-01" })).toBe(
      "Ngày kết thúc phải sau ngày bắt đầu.",
    );
  });

  it("rejects a window longer than the backend's 12 month cap", () => {
    expect(rangeProblem({ from: "2025-01-01", to: "2026-06-01" })).toBe(
      "Khoảng báo cáo tối đa 12 tháng.",
    );
  });

  it("rejects an unparseable date", () => {
    expect(rangeProblem({ from: "", to: "2026-09-01" })).toBe(
      "Ngày bắt đầu hoặc ngày kết thúc không hợp lệ.",
    );
  });

  it("labels the range with an inclusive last day", () => {
    // `to` is exclusive on the wire, so August must read as ending on the 31st.
    expect(formatRangeLabel({ from: "2026-08-01", to: "2026-09-01" })).toBe(
      "01/08/2026 – 31/08/2026",
    );
  });

  it("falls back for an unusable date", () => {
    expect(formatDate(undefined)).toBe(MISSING);
  });
});

describe("metrics", () => {
  const report = {
    generatedAt: "2026-08-24T10:00:00.000Z",
    metrics: {
      recognizedRevenueVnd: { value: 1_500_000 },
      completedAppointmentCount: { value: 12 },
      averageTicketVnd: { value: null },
    },
  };

  it("formats money and counts differently and keeps null unknown", () => {
    const tiles = toMetricTiles(report);
    expect(tiles.map((tile) => tile.id)).toEqual([
      "recognizedRevenueVnd",
      "completedAppointmentCount",
      "averageTicketVnd",
    ]);
    expect(tiles[1].value).toBe("12");
    expect(tiles[1].label).toBe("Lịch hẹn hoàn tất");
    // A null metric is a fact the backend never made — never render it as 0.
    expect(tiles[2].value).toBe(MISSING);
    expect(tiles[0].value).toContain("1.500.000");
  });

  it("returns nothing when the payload carries no metrics", () => {
    expect(toMetricTiles(undefined)).toEqual([]);
    expect(toMetricTiles({ generatedAt: "x" })).toEqual([]);
  });

  it("reads the customers report aggregates out of segments", () => {
    const tiles = toSegmentTiles({ segments: { uniqueCompletedCustomerCount: 7 } });
    expect(tiles).toEqual([
      { id: "uniqueCompletedCustomerCount", label: "Khách đã phục vụ", value: "7" },
    ]);
  });
});

describe("rows", () => {
  it("treats a report with no rows as empty rather than throwing", () => {
    // The customers report genuinely omits `rows`.
    expect(toRows({ segments: { uniqueCompletedCustomerCount: 1 } })).toEqual([]);
    expect(toRows(undefined)).toEqual([]);
  });

  it("derives columns from the union of row keys", () => {
    const columns = toColumns([
      { branchId: "b1", recognizedRevenueVnd: 100 },
      { branchId: "b2", branchName: "Quận 1", recognizedRevenueVnd: 200 },
    ]);
    expect(columns.map((column) => column.key)).toEqual([
      "branchId",
      "recognizedRevenueVnd",
      "branchName",
    ]);
    expect(columns[1].isNumeric).toBe(true);
    expect(columns[2].isNumeric).toBe(false);
    expect(columns[2].label).toBe("Tên chi nhánh");
  });

  it("formats cells by key, not by guesswork", () => {
    expect(formatCell("recognizedRevenueVnd", 200_000)).toContain("200.000");
    expect(formatCell("completedAppointmentCount", 3)).toBe("3");
    expect(formatCell("branchName", "Quận 1")).toBe("Quận 1");
    expect(formatCell("branchName", null)).toBe(MISSING);
  });
});

describe("export status", () => {
  it("names each backend failure code in Vietnamese", () => {
    expect(exportErrorMessage("REPORT_NO_DATA")).toBe(
      "Khoảng thời gian này chưa có dữ liệu để xuất.",
    );
    expect(exportErrorMessage("REPORT_SCOPE_FORBIDDEN")).toContain("không có quyền");
  });

  it("still says something useful for an unknown code", () => {
    expect(exportErrorMessage("SOMETHING_NEW")).toContain("SOMETHING_NEW");
    expect(exportErrorMessage(null)).toBe("Tạo bản xuất thất bại.");
  });

  it("labels the three statuses the backend uses", () => {
    expect(exportStatusLabel("QUEUED")).toBe("Đang xử lý…");
    expect(exportStatusLabel("READY")).toBe("Sẵn sàng tải về");
    expect(exportStatusLabel("FAILED")).toBe("Thất bại");
  });
});

describe("tabs", () => {
  it("maps every tab to a report type the backend accepts", () => {
    // The backend rejects anything outside this set with 422.
    const accepted = ["REVENUE_SUMMARY", "BRANCHES", "CUSTOMERS", "STAFF_PERFORMANCE"];
    expect(reportTabs.map((tab) => tab.exportType)).toEqual(accepted);
  });

  it("guards tab ids coming back out of the Tabs component", () => {
    expect(isReportTabId("staff")).toBe(true);
    expect(isReportTabId("nonsense")).toBe(false);
  });
});
