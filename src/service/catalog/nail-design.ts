import type { NailDesign } from "./types";

export interface NailDesignCardModel {
  readonly id: string;
  readonly name: string;
  readonly imageUrl: string | null;
  readonly indicativePrice: number | null;
}

const firstText = (...values: ReadonlyArray<unknown>): string | null => {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
};

/** Maps both the current production response and legacy web aliases to one card model. */
export function toNailDesignCard(design: NailDesign): NailDesignCardModel {
  const price = design.indicativePrice;
  return {
    id: design.id,
    name: firstText(design.localizedName, design.nameVi, design.title, design.name) ?? "Mẫu nail YABAI",
    imageUrl: firstText(design.thumbnailUrl, design.images?.[0], design.imageUrl),
    indicativePrice: typeof price === "number" && Number.isInteger(price) && price >= 0 ? price : null,
  };
}

