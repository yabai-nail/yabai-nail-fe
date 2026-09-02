"use client";

import { Pagination } from "@heroui/react";
import { pageWindow } from "@/lib/admin-pagination";

type AdminPaginationProps = {
  readonly page: number;
  readonly pageCount: number;
  readonly onPageChange: (page: number) => void;
  /** Names the control for screen readers when a screen shows more than one list. */
  readonly label?: string;
};

/**
 * Every admin list drew its own row of buttons, one per page, so a list long enough to need
 * pages was long enough to fill the footer with them -- an unbounded account list would have
 * produced dozens. This shows a fixed seven slots and puts the rest behind an ellipsis, and
 * carries the prev/next controls and the `<nav>` semantics the hand-rolled rows never had.
 */
export function AdminPagination({ page, pageCount, onPageChange, label = "Phân trang" }: AdminPaginationProps) {
  if (pageCount <= 1) return null;
  const slots = pageWindow(page, pageCount);

  return (
    <Pagination aria-label={label} className="w-auto shrink-0">
      <Pagination.Content>
        <Pagination.Item>
          <Pagination.Previous
            aria-label="Trang trước"
            isDisabled={page <= 1}
            onPress={() => onPageChange(page - 1)}
          >
            <Pagination.PreviousIcon />
          </Pagination.Previous>
        </Pagination.Item>
        {slots.map((slot, index) =>
          slot === "ellipsis" ? (
            <Pagination.Item key={`gap-${index}`}>
              <Pagination.Ellipsis />
            </Pagination.Item>
          ) : (
            <Pagination.Item key={slot}>
              <Pagination.Link
                isActive={slot === page}
                aria-label={`Trang ${slot}`}
                onPress={() => onPageChange(slot)}
              >
                {slot}
              </Pagination.Link>
            </Pagination.Item>
          ),
        )}
        <Pagination.Item>
          <Pagination.Next
            aria-label="Trang sau"
            isDisabled={page >= pageCount}
            onPress={() => onPageChange(page + 1)}
          >
            <Pagination.NextIcon />
          </Pagination.Next>
        </Pagination.Item>
      </Pagination.Content>
    </Pagination>
  );
}

export const meta = { world: "pure", domain: "admin-pagination" } as const;
