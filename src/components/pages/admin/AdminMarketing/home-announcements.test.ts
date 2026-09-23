import { describe, expect, it } from "vitest";

import {
  HOME_ANNOUNCEMENT_LIMIT,
  moveAnnouncementAt,
  removeAnnouncementAt,
  toAnnouncementDrafts,
  toAnnouncementInputs,
  upsertAnnouncement,
  validateAnnouncementDraft,
  type AnnouncementDraft,
} from "./home-announcements";

const TZ = "Asia/Tokyo";
const draft = (key: string, over: Partial<AnnouncementDraft> = {}): AnnouncementDraft => ({
  key, id: key, title: `Tin ${key}`, message: "", branchIds: [], startDate: "", endDate: "", active: true, ...over,
});

describe("home announcement drafts", () => {
  it("round-trips salon-local dates", () => {
    const [row] = toAnnouncementDrafts([{ id: "n1", title: "Nghỉ", message: "", branchIds: ["b1"], startAt: "2026-09-29T15:00:00.000Z", endAt: "2026-09-30T14:59:00.000Z", sortOrder: 0, active: true }], TZ);
    expect(row).toMatchObject({ key: "n1", id: "n1", startDate: "2026-09-30", endDate: "2026-09-30", branchIds: ["b1"] });
    expect(toAnnouncementInputs([row], TZ)[0]).toEqual({
      id: "n1", title: "Nghỉ", message: "", branchIds: ["b1"], active: true,
      startAt: "2026-09-30T00:00:00+09:00", endAt: "2026-09-30T23:59:00+09:00",
    });
  });

  it("sorts stored items by sortOrder and sends blank dates as null and new rows without id", () => {
    const rows = toAnnouncementDrafts([
      { id: "b", title: "B", message: "", branchIds: [], startAt: null, endAt: null, sortOrder: 1, active: true },
      { id: "a", title: "A", message: "", branchIds: [], startAt: null, endAt: null, sortOrder: 0, active: false },
    ], TZ);
    expect(rows.map((row) => row.id)).toEqual(["a", "b"]);
    expect(toAnnouncementInputs([draft("new", { id: null, title: "  Mới  ", message: " x " })], TZ)[0]).toEqual({
      title: "Mới", message: "x", branchIds: [], startAt: null, endAt: null, active: true,
    });
  });

  it("validates title, lengths and date order", () => {
    expect(validateAnnouncementDraft(draft("a", { title: "  " }))).toBe("title");
    expect(validateAnnouncementDraft(draft("a", { title: "x".repeat(81) }))).toBe("titleLength");
    expect(validateAnnouncementDraft(draft("a", { message: "x".repeat(501) }))).toBe("messageLength");
    expect(validateAnnouncementDraft(draft("a", { startDate: "2026-10-02", endDate: "2026-10-01" }))).toBe("dateOrder");
    expect(validateAnnouncementDraft(draft("a", { startDate: "2026-10-01", endDate: "2026-10-01" }))).toBeNull();
  });

  it("moves, removes and upserts by key within the limit", () => {
    const items = [draft("a"), draft("b"), draft("c")];
    expect(moveAnnouncementAt(items, 2, -1).map((row) => row.key)).toEqual(["a", "c", "b"]);
    expect(moveAnnouncementAt(items, 0, -1)).toBe(items);
    expect(removeAnnouncementAt(items, 1).map((row) => row.key)).toEqual(["a", "c"]);
    expect(upsertAnnouncement(items, draft("b", { title: "Sửa" }))[1].title).toBe("Sửa");
    expect(upsertAnnouncement(items, draft("d")).map((row) => row.key)).toEqual(["a", "b", "c", "d"]);
    const full = Array.from({ length: HOME_ANNOUNCEMENT_LIMIT }, (_, i) => draft(`k${i}`));
    expect(() => upsertAnnouncement(full, draft("extra"))).toThrow();
  });
});
