import { beforeEach, describe, expect, it, vi } from "vitest";

const operation = vi.hoisted(() => vi.fn());
vi.mock("../api", () => ({ useApiOperation: operation, usePaginatedApiOperation: vi.fn() }));
import { useRevenueReport, useRevenueReportRange } from "./hooks";

beforeEach(() => operation.mockClear());

describe("dashboard revenue request scope", () => {
  it("includes the branch in the query/cache identity for a selected month", () => {
    useRevenueReportRange("2026-09-01", "2026-10-01", "hiro");
    expect(operation).toHaveBeenLastCalledWith("GET /api/v1/admin/reports/revenue-summary", { query: { from: "2026-09-01", to: "2026-10-01", branchId: "hiro" } });
    useRevenueReportRange("2026-09-01", "2026-10-01", "empty-branch");
    expect(operation).toHaveBeenLastCalledWith("GET /api/v1/admin/reports/revenue-summary", { query: { from: "2026-09-01", to: "2026-10-01", branchId: "empty-branch" } });
  });

  it("does not request organization totals while dashboard branch selection is missing", () => {
    useRevenueReportRange("2026-09-01", "2026-10-01", null);
    expect(operation.mock.calls[0][0]).toBeNull();
  });

  it("preserves the unscoped organization Reports request", () => {
    useRevenueReport("2026-09-01", "2026-10-01");
    expect(operation).toHaveBeenLastCalledWith("GET /api/v1/admin/reports/revenue-summary", { query: { from: "2026-09-01", to: "2026-10-01" } });
    useRevenueReportRange("2026-09-01", "2026-10-01");
    expect(operation).toHaveBeenLastCalledWith("GET /api/v1/admin/reports/revenue-summary", { query: { from: "2026-09-01", to: "2026-10-01" } });
  });
});
