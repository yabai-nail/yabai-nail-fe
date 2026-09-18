import { describe, expect, it } from "vitest";

import {
  HOME_BANNER_LIMIT,
  moveBannerAt,
  removeBannerAt,
  toBannerInputs,
  upsertBanner,
  type BannerDraft,
} from "./home-banners";

const draft = (mediaId: string, over: Partial<BannerDraft> = {}): BannerDraft => ({
  key: mediaId,
  mediaId,
  imageUrl: `https://api/media/${mediaId}/public-content`,
  title: null,
  link: null,
  active: true,
  ...over,
});

describe("home banner drafts", () => {
  it("moves a slide up or down and refuses to move past either end", () => {
    const items = [draft("a"), draft("b"), draft("c")];
    expect(moveBannerAt(items, 2, -1).map((item) => item.mediaId)).toEqual(["a", "c", "b"]);
    expect(moveBannerAt(items, 0, 1).map((item) => item.mediaId)).toEqual(["b", "a", "c"]);
    expect(moveBannerAt(items, 0, -1)).toBe(items);
    expect(moveBannerAt(items, 2, 1)).toBe(items);
  });

  it("removes a slide by position", () => {
    expect(removeBannerAt([draft("a"), draft("b")], 0).map((item) => item.mediaId)).toEqual(["b"]);
  });

  it("appends a new slide and replaces an existing one by key, keeping its place", () => {
    const items = [draft("a"), draft("b")];
    expect(upsertBanner(items, draft("c")).map((item) => item.mediaId)).toEqual(["a", "b", "c"]);
    const edited = upsertBanner(items, draft("b", { key: "b", title: "Sale" }));
    expect(edited.map((item) => item.mediaId)).toEqual(["a", "b"]);
    expect(edited[1].title).toBe("Sale");
  });

  it("will not append past the limit the API enforces", () => {
    const full = Array.from({ length: HOME_BANNER_LIMIT }, (_, i) => draft(`m${i}`));
    expect(() => upsertBanner(full, draft("extra"))).toThrow();
  });

  it("sends only what the API assigns nothing for: order is the array order", () => {
    // Blank title/link travel as null, so a cleared field clears the stored value.
    expect(toBannerInputs([draft("a", { title: "  Hi  ", link: "" }), draft("b", { active: false })])).toEqual([
      { mediaId: "a", title: "Hi", link: null, active: true },
      { mediaId: "b", title: null, link: null, active: false },
    ]);
  });
});
