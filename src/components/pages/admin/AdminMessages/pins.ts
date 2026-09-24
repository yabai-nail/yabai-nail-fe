import { ApiClientError } from "@/service/api/contracts";

/** Index of the first unpinned row, where the "pinned" group ends; -1 when there is only one group. */
export function pinnedBoundaryIndex(conversations: ReadonlyArray<{ readonly pinned: boolean }>): number {
  const index = conversations.findIndex((conversation) => !conversation.pinned);
  return index > 0 ? index : -1;
}

export function isPinLimitError(error: unknown): boolean {
  return error instanceof ApiClientError && error.code === "PIN_LIMIT_REACHED";
}
