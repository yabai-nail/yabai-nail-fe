import { describe, expect, it } from "vitest";
import type { AdminReview } from "@/service";
import {
  UNHANDLED_FILTER,
  collectHandlingStatuses,
  formatRating,
  handlingStatusLabel,
  matchesHandlingFilter,
  toReviewRow,
} from "./normalize";

function makeServerReview(overrides: Record<string, unknown> = {}): AdminReview {
  return {
    id: "rv-1",
    appointmentId: "ap-1",
    customerId: "c1234567-89ab-cdef-0123-456789abcdef",
    branchId: "b1",
    rating: 4,
    status: "PUBLISHED",
    createdAt: "2026-08-24T10:00:00.000Z",
    version: 3,
    ...overrides,
  } as AdminReview;
}

describe("toReviewRow", () => {
  it("keeps missing optional fields blank instead of inventing them", () => {
    const row = toReviewRow(makeServerReview());

    expect(row.content).toBe("");
    expect(row.handlingStatus).toBe("");
    expect(row.replyContent).toBe("");
    expect(row.customerLabel).toBe("Khách #c12345");
    expect(row.version).toBe(3);
  });

  it("reads nested handling and reply blocks when the backend sends them", () => {
    const row = toReviewRow(
      makeServerReview({
        content: "Dịch vụ rất tốt",
        customerName: "Nguyễn An",
        handling: { status: "RESOLVED", note: "Đã gọi khách" },
        reply: { id: "rp-1", content: "Cảm ơn chị", createdAt: "2026-08-24T11:00:00.000Z" },
      }),
    );

    expect(row.customerLabel).toBe("Nguyễn An");
    expect(row.handlingStatus).toBe("RESOLVED");
    expect(row.handlingNote).toBe("Đã gọi khách");
    expect(row.replyContent).toBe("Cảm ơn chị");
  });

  it("drops a non-numeric version so no bogus If-Match is sent", () => {
    const row = toReviewRow(makeServerReview({ version: "3" }));

    expect(row.version).toBeUndefined();
  });
});

describe("matchesHandlingFilter", () => {
  const handled = toReviewRow(makeServerReview({ handling: { status: "RESOLVED" } }));
  const untouched = toReviewRow(makeServerReview({ id: "rv-2" }));

  it("passes everything through on the all filter", () => {
    expect(matchesHandlingFilter(handled, "all")).toBe(true);
    expect(matchesHandlingFilter(untouched, "all")).toBe(true);
  });

  it("isolates rows the salon has not touched yet", () => {
    expect(matchesHandlingFilter(untouched, UNHANDLED_FILTER)).toBe(true);
    expect(matchesHandlingFilter(handled, UNHANDLED_FILTER)).toBe(false);
  });

  it("matches an exact handling status", () => {
    expect(matchesHandlingFilter(handled, "RESOLVED")).toBe(true);
    expect(matchesHandlingFilter(handled, "PENDING")).toBe(false);
  });
});

describe("collectHandlingStatuses", () => {
  it("merges statuses seen on real rows with the fallbacks, without duplicates", () => {
    const rows = [
      toReviewRow(makeServerReview({ handling: { status: "ESCALATED" } })),
      toReviewRow(makeServerReview({ id: "rv-2", handling: { status: "RESOLVED" } })),
    ];

    const statuses = collectHandlingStatuses(rows);

    expect(statuses).toContain("ESCALATED");
    expect(statuses.filter((status) => status === "RESOLVED")).toHaveLength(1);
    expect(statuses).toContain("PENDING");
  });
});

describe("labels", () => {
  it("falls back to the raw code for a status it does not know", () => {
    expect(handlingStatusLabel("RESOLVED")).toBe("Đã xử lý");
    expect(handlingStatusLabel("ESCALATED")).toBe("ESCALATED");
    expect(handlingStatusLabel("")).toBe("Chưa xử lý");
  });

  it("renders a five-slot star scale", () => {
    expect(formatRating(4)).toBe("★★★★☆");
    expect(formatRating(0)).toBe("☆☆☆☆☆");
    expect(formatRating(9)).toBe("★★★★★");
  });
});
