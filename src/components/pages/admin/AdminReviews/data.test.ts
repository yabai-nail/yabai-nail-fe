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
    expect(filterReviews(reviewFixtures, "NEW", "").map((r) => r.id)).toEqual(["rv2", "rv5"]);
    expect(filterReviews(reviewFixtures, "all", "cường").map((r) => r.id)).toEqual(["rv3"]);
  });

  it("lists distinct handling statuses sorted", () => {
    // NEW / IN_PROGRESS / RESOLVED are the only codes the API accepts.
    expect(handlingStatuses(reviewFixtures)).toEqual(["IN_PROGRESS", "NEW", "RESOLVED"]);
  });

  it("renders rating as five clamped stars", () => {
    expect(ratingStars(5)).toBe("★★★★★");
    expect(ratingStars(2)).toBe("★★☆☆☆");
    expect(ratingStars(9)).toBe("★★★★★");
  });

  // Field-for-field the payload GET /admin/branches/{id}/reviews really returns.
  // The previous version of this test asserted `rating`, `content`,
  // `handling.status` and `reply.content` — none of which the API sends — so it
  // stayed green while the table rendered four empty columns.
  const liveReview = {
    id: "5ee9d6e8-eb37-4a20-8aa2-e03d61f465fd",
    appointmentId: "3339ad7c-22b7-4540-8916-4dc5c8271935",
    customerId: "596b00ad-c95a-4211-aba6-f3cb24b34ead",
    serviceRating: 4,
    staffRating: 5,
    comment: "Review kiem thu E2E.",
    managerReply: "Cam on ban da danh gia.",
    consentToPublish: true,
    handlingStatus: "IN_PROGRESS",
    createdAt: "2026-08-25T23:40:17.165Z",
    updatedAt: "2026-08-25T23:40:17.382Z",
    version: 3,
  };

  it("reads the fields the API actually sends", () => {
    const row = adaptReview(liveReview);
    expect(row).toMatchObject({
      serviceRating: 4,
      staffRating: 5,
      content: "Review kiem thu E2E.",
      replyContent: "Cam on ban da danh gia.",
      handlingStatus: "IN_PROGRESS",
      version: 3,
    });
  });

  it("resolves the customer name without exposing a technical id while the list loads", () => {
    const named = adaptReview(liveReview, new Map([[liveReview.customerId, "Test Khach A DA SUA"]]));
    expect(named.customerName).toBe("Test Khach A DA SUA");
    expect(adaptReview(liveReview).customerName).toBe("Khách chưa có tên");
  });

  it("keeps an unanswered review distinguishable from an answered one", () => {
    const row = adaptReview({ ...liveReview, managerReply: undefined, comment: undefined });
    expect(row.replyContent).toBeUndefined();
    expect(row.content).toBe("");
  });

  it("paginates and clamps", () => {
    const result = paginate(reviewFixtures, 9, 2);
    expect(result.page).toBe(result.pageCount);
    expect(() => paginate(reviewFixtures, 1, 0)).toThrow(RangeError);
  });
});
