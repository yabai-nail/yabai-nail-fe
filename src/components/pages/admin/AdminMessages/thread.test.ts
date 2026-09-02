import { describe, expect, it } from "vitest";

import type { ChatMessage } from "./data";
import { groupThread } from "./thread";

const NOW = new Date("2026-09-02T10:00:00+07:00");

function msg(
  id: string,
  sender: ChatMessage["sender"],
  sentAt: string,
  content = id,
): ChatMessage {
  return { id, sender, content, time: "00:00", sentAt };
}

describe("groupThread", () => {
  it("returns nothing for an empty thread", () => {
    expect(groupThread([], NOW)).toEqual([]);
  });

  it("gathers consecutive messages from one sender into a single run", () => {
    const days = groupThread(
      [
        msg("a", "customer", "2026-09-02T08:00:00+07:00"),
        msg("b", "customer", "2026-09-02T08:01:00+07:00"),
        msg("c", "customer", "2026-09-02T08:02:00+07:00"),
      ],
      NOW,
    );
    expect(days).toHaveLength(1);
    expect(days[0].runs).toHaveLength(1);
    expect(days[0].runs[0].messages.map((m) => m.id)).toEqual(["a", "b", "c"]);
  });

  it("breaks the run where the sender changes", () => {
    const days = groupThread(
      [
        msg("a", "customer", "2026-09-02T08:00:00+07:00"),
        msg("b", "salon", "2026-09-02T08:01:00+07:00"),
        msg("c", "customer", "2026-09-02T08:02:00+07:00"),
      ],
      NOW,
    );
    expect(days[0].runs.map((r) => r.sender)).toEqual(["customer", "salon", "customer"]);
  });

  it("labels today, yesterday and anything older by its date", () => {
    const days = groupThread(
      [
        msg("old", "customer", "2026-08-28T09:00:00+07:00"),
        msg("yst", "customer", "2026-09-01T09:00:00+07:00"),
        msg("now", "customer", "2026-09-02T09:00:00+07:00"),
      ],
      NOW,
    );
    expect(days.map((d) => d.label)).toEqual(["28/8/2026", "Hôm qua", "Hôm nay"]);
  });

  it("never merges a run across a day boundary", () => {
    // Same sender either side of midnight: one run would hide the date change.
    const days = groupThread(
      [
        msg("a", "customer", "2026-09-01T23:59:00+07:00"),
        msg("b", "customer", "2026-09-02T00:01:00+07:00"),
      ],
      NOW,
    );
    expect(days).toHaveLength(2);
    expect(days.map((d) => d.runs.length)).toEqual([1, 1]);
  });

  it("keeps every message, in the order it was given", () => {
    const input = [
      msg("a", "customer", "2026-09-01T23:00:00+07:00"),
      msg("b", "salon", "2026-09-02T08:00:00+07:00"),
      msg("c", "salon", "2026-09-02T08:01:00+07:00"),
      msg("d", "customer", "2026-09-02T08:02:00+07:00"),
    ];
    const flat = groupThread(input, NOW).flatMap((d) => d.runs.flatMap((r) => r.messages));
    expect(flat.map((m) => m.id)).toEqual(["a", "b", "c", "d"]);
  });

  it("carries a message with an unreadable timestamp instead of dropping it", () => {
    // The adapter can only pass through what the API sent. A message we cannot
    // date is still a message the admin needs to read.
    const days = groupThread(
      [
        msg("a", "customer", "2026-09-02T08:00:00+07:00"),
        msg("broken", "customer", "not-a-date"),
      ],
      NOW,
    );
    const flat = days.flatMap((d) => d.runs.flatMap((r) => r.messages));
    expect(flat.map((m) => m.id)).toEqual(["a", "broken"]);
  });

  it("shows no date separator for a thread it cannot date at all", () => {
    const days = groupThread([msg("broken", "customer", "not-a-date")], NOW);
    expect(days.map((d) => d.label)).toEqual([""]);
  });
});
