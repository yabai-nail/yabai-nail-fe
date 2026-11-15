import type { AdminAppliedSale, AdminNailDesign, BackendList } from "@/service";
import { matchesSearch } from "@/lib/admin-search";

/** The tier filter's option for designs with their own typed price rather than a tier. */
export const CUSTOM_PRICE = "custom";

export type DesignRow = {
  readonly id: string;
  readonly title: string;
  readonly status: string;
  readonly version: number;
  readonly mediaIds: ReadonlyArray<string>;
  /** Stable public URL of the cover photo, or null when the design has none. */
  readonly thumbnailUrl: string | null;
  readonly indicativePrice: number | null;
  /** The tier the price comes from; null for a typed price. */
  readonly priceTierId: string | null;
  /** The running sale on this design, as the API computed it. */
  readonly sale: AdminAppliedSale | null;
};

export function adaptDesign(design: AdminNailDesign): DesignRow {
  return {
    id: design.id,
    title: design.title,
    status: design.status,
    version: design.version,
    mediaIds: design.mediaIds ?? [],
    // The API derives these from mediaIds; a row written before it did has neither, and
    // shows the placeholder rather than a broken image.
    thumbnailUrl: design.thumbnailUrl ?? design.images?.[0] ?? null,
    indicativePrice: typeof design.indicativePrice === "number" ? design.indicativePrice : null,
    priceTierId: design.priceTierId ?? null,
    sale: design.sale ?? null,
  };
}

/** Apply the mutation response immediately while SWR revalidates in the background. */
export function upsertDesignInList(
  current: BackendList<AdminNailDesign> | undefined,
  saved: AdminNailDesign,
): BackendList<AdminNailDesign> | undefined {
  if (!current) return current;
  const existingIndex = current.items.findIndex((design) => design.id === saved.id);
  const items = existingIndex === -1
    ? [saved, ...current.items]
    : current.items.map((design) => design.id === saved.id ? saved : design);
  return { ...current, items };
}

export const designFixtures: ReadonlyArray<DesignRow> = [
  { id: "nd1", title: "Gradient hồng pastel", status: "PUBLISHED", version: 1, mediaIds: [], thumbnailUrl: null, indicativePrice: 9000, priceTierId: null, sale: null },
  { id: "nd2", title: "Mèo mắt xanh", status: "PUBLISHED", version: 2, mediaIds: [], thumbnailUrl: null, indicativePrice: 12000, priceTierId: null, sale: null },
  { id: "nd3", title: "French classic", status: "DRAFT", version: 1, mediaIds: [], thumbnailUrl: null, indicativePrice: null, priceTierId: null, sale: null },
  { id: "nd4", title: "Đính đá Swarovski", status: "ARCHIVED", version: 3, mediaIds: [], thumbnailUrl: null, indicativePrice: 0, priceTierId: null, sale: null },
];

export function designStatuses(rows: ReadonlyArray<DesignRow>): ReadonlyArray<string> {
  return Array.from(new Set(rows.map((row) => row.status))).sort();
}

export function filterDesigns(
  rows: ReadonlyArray<DesignRow>,
  status: string,
  query: string,
): ReadonlyArray<DesignRow> {
  return rows.filter(
    (row) => (status === "all" || row.status === status) && matchesSearch(query, [row.title]),
  );
}

/** No tier ticked keeps every row; `custom` among them keeps the designs with a typed price. */
export function filterDesignsByTier(
  rows: ReadonlyArray<DesignRow>,
  tierIds: ReadonlyArray<string>,
  custom: string = CUSTOM_PRICE,
): ReadonlyArray<DesignRow> {
  if (tierIds.length === 0) return rows;
  return rows.filter((row) => tierIds.includes(row.priceTierId ?? custom));
}

export function isOnSale(row: Pick<DesignRow, "sale">): boolean {
  return row.sale !== null;
}

export { paginate } from "@/lib/admin-pagination";
