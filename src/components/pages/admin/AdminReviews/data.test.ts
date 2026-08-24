import { describe, expect, it } from "vitest";
import {
  adaptReview,
  filterReviews,
  handlingStatuses,
  paginate,
  ratingStars,
  reviewFixtures,
} from "./data";

describe("review list derivation", () => {
  it("filters by handling status and query", () => {
    expect(filterReviews(reviewFixtures, "PENDING", "").map((r) => r.id)).toEqual(["rv2", "rv5"]);
    expect(filterReviews(reviewFixtures, "all", "cường").map((r) => r.id)).toEqual(["rv3"]);
  });

  it("lists distinct handling statuses sorted", () => {
    expect(handlingStatuses(reviewFixtures)).toEqual(["ESCALATED", "PENDING", "RESOLVED"]);
  });

  it("renders rating as five clamped stars", () => {
    expect(ratingStars(5)).toBe("★★★★★");
    expect(ratingStars(2)).toBe("★★☆☆☆");
    expect(ratingStars(9)).toBe("★★★★★");
  });

  it("adapts a backend review including nested handling and reply", () => {
    const row = adaptReview({
      id: "r1",
      appointmentId: "a1",
      customerId: "cust-1",
      branchId: "b1",
      rating: 4,
      content: "ok",
      status: "PUBLISHED",
      createdAt: "2026-08-24T00:00:00.000Z",
      handling: { status: "RESOLVED" },
      reply: { id: "rp1", content: "thanks", createdAt: "2026-08-24T01:00:00.000Z" },
      version: 2,
    });
    expect(row).toMatchObject({ id: "r1", handlingStatus: "RESOLVED", replyContent: "thanks", version: 2 });
  });

  it("defaults handling status to PENDING when absent", () => {
    const row = adaptReview({
      id: "r2", appointmentId: "a", customerId: "c", branchId: "b",
      rating: 3, status: "PUBLISHED", createdAt: "2026-08-24T00:00:00.000Z", version: 1,
    });
    expect(row.handlingStatus).toBe("PENDING");
    expect(row.replyContent).toBeUndefined();
  });

  it("paginates and clamps", () => {
    const result = paginate(reviewFixtures, 9, 2);
    expect(result.page).toBe(result.pageCount);
    expect(() => paginate(reviewFixtures, 1, 0)).toThrow(RangeError);
  });
});
