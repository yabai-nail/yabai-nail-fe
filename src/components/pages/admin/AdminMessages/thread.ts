import { isoDateInTimeZone } from "@/lib/salon-date";

import type { ChatMessage } from "./data";

/** Consecutive messages from one sender, on one day. */
export type ThreadRun = {
  readonly sender: ChatMessage["sender"];
  readonly messages: ReadonlyArray<ChatMessage>;
};

export type ThreadDay = {
  /** The salon's calendar day as `YYYY-MM-DD`, or "" when the timestamp would not parse. */
  readonly key: string;
  /** Localized relative/date label, or an empty string when the day is unknown. */
  readonly label: string;
  readonly runs: ReadonlyArray<ThreadRun>;
};

export type ThreadDateLabels = {
  readonly today: string;
  readonly yesterday: string;
  readonly formatDate: (date: Date) => string;
};

/**
 * A message belongs to the salon's day, never to the day in whichever zone the
 * code happens to be running in.
 *
 * Read off the runtime clock, 23:59 and 00:01 either side of midnight in Vietnam
 * fell into one section anywhere west of UTC+7 — the browser of an admin who is
 * travelling, and CI, which runs in UTC.
 */
function dayKey(date: Date): string {
  return isoDateInTimeZone(date);
}

/**
 * The calendar day before `key`, both `YYYY-MM-DD`. Stepped in UTC, where every
 * day is 24 hours long, so no DST change in the salon's zone or the runtime's
 * can turn "yesterday" into the day before it.
 */
function previousDay(key: string): string {
  const midnight = new Date(`${key}T00:00:00Z`);
  midnight.setUTCDate(midnight.getUTCDate() - 1);
  return midnight.toISOString().slice(0, 10);
}

/**
 * The API returns the newest page first but keeps each page chronological.
 * Sorting the merged collection restores one chronological thread across page
 * boundaries; id makes equal timestamps deterministic.
 */
export function sortThreadChronologically(
  messages: ReadonlyArray<ChatMessage>,
): ReadonlyArray<ChatMessage> {
  return [...messages].sort((left, right) => {
    const leftTime = Date.parse(left.sentAt);
    const rightTime = Date.parse(right.sentAt);
    if (!Number.isNaN(leftTime) && !Number.isNaN(rightTime) && leftTime !== rightTime) {
      return leftTime - rightTime;
    }
    const timestampOrder = left.sentAt.localeCompare(right.sentAt);
    return timestampOrder || left.id.localeCompare(right.id);
  });
}

/**
 * Built by hand rather than through toLocaleDateString so the label does not
 * change with the ICU data the test happens to run against.
 */
function dayLabel(date: Date, now: Date, labels: ThreadDateLabels): string {
  const today = dayKey(now);
  const key = dayKey(date);
  if (key === today) return labels.today;
  if (key === previousDay(today)) return labels.yesterday;
  return labels.formatDate(date);
}

/**
 * Splits a thread into days, and each day into runs of consecutive messages
 * from the same sender.
 *
 * Runs are what let the view stop repeating itself: one timestamp and one
 * corner treatment per run rather than per message, so three quick replies read
 * as one turn in the conversation instead of three identical boxes.
 *
 * A message whose `sentAt` will not parse keeps its place in the thread and
 * joins the day already open — losing a message because its timestamp is
 * malformed would be worse than showing it under a neighbouring date. When such
 * a message opens the thread there is no day to join, so its section carries an
 * empty label and the view draws no separator.
 */
export function groupThread(
  messages: ReadonlyArray<ChatMessage>,
  now: Date = new Date(),
  labels: ThreadDateLabels = {
    today: dayKey(now),
    yesterday: previousDay(dayKey(now)),
    formatDate: dayKey,
  },
): ReadonlyArray<ThreadDay> {
  const days: ThreadDay[] = [];

  for (const message of messages) {
    const date = new Date(message.sentAt);
    const dated = !Number.isNaN(date.getTime());
    const open = days.at(-1);

    // An undatable message belongs to whichever day is already open.
    const key = dated ? dayKey(date) : (open?.key ?? "");
    const label = dated ? dayLabel(date, now, labels) : (open?.label ?? "");

    if (!open || open.key !== key) {
      days.push({ key, label, runs: [{ sender: message.sender, messages: [message] }] });
      continue;
    }

    const runs = open.runs as ThreadRun[];
    const openRun = runs.at(-1);
    if (openRun && openRun.sender === message.sender) {
      (openRun.messages as ChatMessage[]).push(message);
    } else {
      runs.push({ sender: message.sender, messages: [message] });
    }
  }

  return days;
}
