"use client";

import { Button, Card } from "@heroui/react";
import { formatDateTime, formatRating, handlingStatusLabel, type ReviewRow } from "./normalize";

type ReviewListProps = {
  readonly reviews: ReadonlyArray<ReviewRow>;
  readonly selectedId: string | null;
  readonly isLoading: boolean;
  readonly errorMessage: string | null;
  readonly pageNumber: number;
  readonly hasPreviousPage: boolean;
  readonly hasNextPage: boolean;
  readonly onSelect: (id: string) => void;
  readonly onPreviousPage: () => void;
  readonly onNextPage: () => void;
};

export function ReviewList({
  reviews,
  selectedId,
  isLoading,
  errorMessage,
  pageNumber,
  hasPreviousPage,
  hasNextPage,
  onSelect,
  onPreviousPage,
  onNextPage,
}: ReviewListProps) {
  return (
    <Card className="rounded-lg border-admin-border bg-admin-surface shadow-none">
      <Card.Content className="p-0">
        {errorMessage ? (
          <p role="alert" className="m-3 rounded-lg bg-danger/10 px-3 py-2 text-xs text-danger">
            {errorMessage}
          </p>
        ) : null}

        {isLoading ? (
          <p className="p-6 text-center text-sm text-admin-muted">Đang tải đánh giá…</p>
        ) : reviews.length === 0 ? (
          <p className="p-6 text-center text-sm text-admin-muted">
            Không có đánh giá nào khớp với bộ lọc hiện tại.
          </p>
        ) : (
          <ul className="divide-y divide-admin-border">
            {reviews.map((review) => {
              const isSelected = review.id === selectedId;
              return (
                <li key={review.id}>
                  <button
                    type="button"
                    aria-current={isSelected ? "true" : undefined}
                    onClick={() => onSelect(review.id)}
                    className={`block w-full cursor-pointer px-4 py-3 text-left transition-colors hover:bg-admin-soft ${
                      isSelected ? "bg-admin-soft" : ""
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="flex min-w-0 items-center gap-2">
                        <span
                          aria-label={`${review.rating} trên 5 sao`}
                          className="text-sm text-admin-accent"
                        >
                          {formatRating(review.rating)}
                        </span>
                        <span className="truncate text-sm font-semibold text-admin-ink">
                          {review.customerLabel}
                        </span>
                      </span>
                      <span className="text-xs text-admin-muted">
                        {formatDateTime(review.createdAt)}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-admin-muted">
                      {review.content || "Khách không để lại nội dung."}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2 text-[0.65rem]">
                      <span
                        className={`rounded-full px-2 py-0.5 ${
                          review.handlingStatus
                            ? "bg-admin-soft text-admin-accent"
                            : "bg-danger/10 text-danger"
                        }`}
                      >
                        {handlingStatusLabel(review.handlingStatus)}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 ${
                          review.replyContent
                            ? "bg-admin-soft text-admin-accent"
                            : "border border-admin-border text-admin-muted"
                        }`}
                      >
                        {review.replyContent ? "Đã trả lời" : "Chưa trả lời"}
                      </span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        <div className="flex items-center justify-between gap-2 border-t border-admin-border px-4 py-3">
          <span className="text-xs text-admin-muted">Trang {pageNumber}</span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              className="rounded-lg border-admin-border"
              onPress={onPreviousPage}
              isDisabled={!hasPreviousPage || isLoading}
            >
              Trang trước
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="rounded-lg border-admin-border"
              onPress={onNextPage}
              isDisabled={!hasNextPage || isLoading}
            >
              Trang sau
            </Button>
          </div>
        </div>
      </Card.Content>
    </Card>
  );
}
