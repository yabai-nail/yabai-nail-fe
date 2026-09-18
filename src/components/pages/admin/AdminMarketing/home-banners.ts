import type { AdminHomeBanner, AdminHomeBannerInput } from "@/service";

/** Mirrors the API's own cap so the panel refuses an eleventh slide before the request does. */
export const HOME_BANNER_LIMIT = 10;

/**
 * One slide as the panel edits it. `key` is the server id for a stored slide and the media id
 * for one added this session, so a row keeps its identity through reorders and edits before
 * anything has been saved.
 */
export type BannerDraft = {
  readonly key: string;
  readonly mediaId: string;
  readonly imageUrl: string;
  readonly title: string | null;
  readonly link: string | null;
  readonly active: boolean;
};

export function toBannerDrafts(items: ReadonlyArray<AdminHomeBanner>): BannerDraft[] {
  return [...items]
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map((item) => ({ key: item.id, mediaId: item.mediaId, imageUrl: item.imageUrl, title: item.title, link: item.link, active: item.active }));
}

/** Returns the same array when the move is impossible, so callers can skip a no-op render. */
export function moveBannerAt(items: ReadonlyArray<BannerDraft>, index: number, direction: -1 | 1): ReadonlyArray<BannerDraft> {
  const target = index + direction;
  if (index < 0 || index >= items.length || target < 0 || target >= items.length) return items;
  const next = [...items];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

export function removeBannerAt(items: ReadonlyArray<BannerDraft>, index: number): ReadonlyArray<BannerDraft> {
  return items.filter((_, position) => position !== index);
}

export function upsertBanner(items: ReadonlyArray<BannerDraft>, banner: BannerDraft): ReadonlyArray<BannerDraft> {
  const position = items.findIndex((item) => item.key === banner.key);
  if (position >= 0) return items.map((item, index) => (index === position ? banner : item));
  if (items.length >= HOME_BANNER_LIMIT) throw new Error(`At most ${HOME_BANNER_LIMIT} banners`);
  return [...items, banner];
}

/** The PUT body: array order is display order, and a blank field is sent as null to clear it. */
export function toBannerInputs(items: ReadonlyArray<BannerDraft>): AdminHomeBannerInput[] {
  const text = (value: string | null) => {
    const trimmed = value?.trim() ?? "";
    return trimmed ? trimmed : null;
  };
  return items.map((item) => ({ mediaId: item.mediaId, title: text(item.title), link: text(item.link), active: item.active }));
}
