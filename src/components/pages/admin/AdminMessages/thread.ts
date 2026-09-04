import type { ChatMessage } from "./data";
import { isoDateInTimeZone, SALON_TIME_ZONE } from "@/lib/salon-date";

/** Consecutive messages from one sender, on one day. */
export type ThreadRun = {
  readonly sender: ChatMessage["sender"];
  readonly messages: ReadonlyArray<ChatMessage>;
};

export type ThreadDay = {
  /** Local calendar day, or "" for messages whose timestamp would not parse. */
  readonly key: string;
  /** "Hôm nay" · "Hôm qua" · "28/8/2026" · "" when the day is unknown. */
  readonly label: string;
  readonly runs: ReadonlyArray<ThreadRun>;
};

function dayKey(date: Date): string {
  return isoDateInTimeZone(date, SALON_TIME_ZONE);
}

/**
 * Built by hand rather than through toLocaleDateString so the label does not
 * change with the ICU data the test happens to run against.
 */
function dayLabel(date: Date, now: Date): string {
  const today = dayKey(now);
  const yesterday = new Date(now.getTime() - 86_400_000);

  const key = dayKey(date);
  if (key === today) return "Hôm nay";
  if (key === dayKey(yesterday)) return "Hôm qua";
  const [year, month, day] = key.split("-");
  return `${Number(day)}/${Number(month)}/${year}`;
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
): ReadonlyArray<ThreadDay> {
  const days: ThreadDay[] = [];

  for (const message of messages) {
    const date = new Date(message.sentAt);
    const dated = !Number.isNaN(date.getTime());
    const open = days.at(-1);

    // An undatable message belongs to whichever day is already open.
    const key = dated ? dayKey(date) : (open?.key ?? "");
    const label = dated ? dayLabel(date, now) : (open?.label ?? "");

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
