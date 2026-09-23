import { isoDateInTimeZone, SALON_TIME_ZONE, zonedIso } from "@/lib/salon-date";
import { ApiClientError } from "@/service";
import type { AdminHomeAnnouncement, AdminHomeAnnouncementInput } from "@/service";

/** Mirrors the API's cap so the panel refuses a 21st item before the request does. */
export const HOME_ANNOUNCEMENT_LIMIT = 20;
const TITLE_LIMIT = 80;
const MESSAGE_LIMIT = 500;

/**
 * One announcement as the panel edits it. Dates are salon-local calendar days (`YYYY-MM-DD`,
 * blank for "no bound"); the start is the day's first minute and the end its last, in salon time.
 * `id` is null until the API has assigned one.
 */
export type AnnouncementDraft = {
  readonly key: string;
  readonly id: string | null;
  readonly title: string;
  readonly message: string;
  readonly branchIds: ReadonlyArray<string>;
  readonly startDate: string;
  readonly endDate: string;
  readonly active: boolean;
};

export type AnnouncementDraftError = "title" | "titleLength" | "messageLength" | "dateOrder";

const localDay = (value: string | null, timeZone: string) => (value ? isoDateInTimeZone(new Date(value), timeZone) : "");

export function toAnnouncementDrafts(items: ReadonlyArray<AdminHomeAnnouncement>, timeZone: string = SALON_TIME_ZONE): AnnouncementDraft[] {
  return [...items]
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map((item) => ({
      key: item.id,
      id: item.id,
      title: item.title,
      message: item.message,
      branchIds: item.branchIds,
      startDate: localDay(item.startAt, timeZone),
      endDate: localDay(item.endAt, timeZone),
      active: item.active,
    }));
}

/** The PUT body: array order is display order; a new row carries no id so the API mints one. */
export function toAnnouncementInputs(items: ReadonlyArray<AnnouncementDraft>, timeZone: string = SALON_TIME_ZONE): AdminHomeAnnouncementInput[] {
  return items.map((item) => ({
    ...(item.id ? { id: item.id } : {}),
    title: item.title.trim(),
    message: item.message.trim(),
    branchIds: item.branchIds,
    startAt: item.startDate ? zonedIso(item.startDate, "00:00", timeZone) : null,
    endAt: item.endDate ? zonedIso(item.endDate, "23:59", timeZone) : null,
    active: item.active,
  }));
}

export function validateAnnouncementDraft(draft: AnnouncementDraft): AnnouncementDraftError | null {
  const title = draft.title.trim();
  if (!title) return "title";
  if (title.length > TITLE_LIMIT) return "titleLength";
  if (draft.message.trim().length > MESSAGE_LIMIT) return "messageLength";
  if (draft.startDate && draft.endDate && draft.endDate < draft.startDate) return "dateOrder";
  return null;
}

/** Returns the same array when the move is impossible, so callers can skip a no-op render. */
export function moveAnnouncementAt(items: ReadonlyArray<AnnouncementDraft>, index: number, direction: -1 | 1): ReadonlyArray<AnnouncementDraft> {
  const target = index + direction;
  if (index < 0 || index >= items.length || target < 0 || target >= items.length) return items;
  const next = [...items];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

export function removeAnnouncementAt(items: ReadonlyArray<AnnouncementDraft>, index: number): ReadonlyArray<AnnouncementDraft> {
  return items.filter((_, position) => position !== index);
}

export function upsertAnnouncement(items: ReadonlyArray<AnnouncementDraft>, draft: AnnouncementDraft): ReadonlyArray<AnnouncementDraft> {
  const position = items.findIndex((item) => item.key === draft.key);
  if (position >= 0) return items.map((item, index) => (index === position ? draft : item));
  if (items.length >= HOME_ANNOUNCEMENT_LIMIT) throw new Error(`At most ${HOME_ANNOUNCEMENT_LIMIT} announcements`);
  return [...items, draft];
}

/** True when a save failed because someone else saved first (API: 412 / `VERSION_CONFLICT`). */
export function isVersionConflict(error: unknown): boolean {
  return error instanceof ApiClientError && (error.status === 412 || error.code === "VERSION_CONFLICT");
}
