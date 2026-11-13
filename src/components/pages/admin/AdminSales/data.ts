import { parseWholeYen } from "@/lib/admin-format";
import type {
  AdminNailDesign,
  AdminSale,
  AdminSaleInput,
  AdminSaleRule,
  AdminSaleScope,
  AdminServiceItem,
} from "@/service";

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
// Tokyo has no daylight saving, so a fixed offset is exact.
const TOKYO_OFFSET = 9 * HOUR;

export function previewSalePrice(
  original: number,
  rule: AdminSaleRule,
): { price: number; applies: boolean } {
  const price =
    rule.type === "FIXED" ? rule.value : Math.floor((original * (100 - rule.value)) / 100);
  // Same guard as the API: a price below ¥1 never applies.
  return { price, applies: price >= 1 && price < original };
}

/** Start of the Tokyo calendar day containing `now`, as a UTC timestamp. */
function tokyoDayStart(now: Date): number {
  return Math.floor((now.getTime() + TOKYO_OFFSET) / DAY) * DAY - TOKYO_OFFSET;
}

export function saleWindowPreset(
  preset: "today" | "weekend" | "week",
  now: Date,
): { startsAt: string; endsAt: string } {
  const iso = (ms: number) => new Date(ms).toISOString();
  const dayStart = tokyoDayStart(now);
  if (preset === "today") {
    return { startsAt: iso(now.getTime()), endsAt: iso(dayStart + DAY - 1000) };
  }
  if (preset === "week") {
    return { startsAt: iso(now.getTime()), endsAt: iso(now.getTime() + 7 * DAY) };
  }
  const weekday = new Date(now.getTime() + TOKYO_OFFSET).getUTCDay(); // 0 = Sunday
  const daysToSunday = (7 - weekday) % 7;
  const sundayStart = dayStart + daysToSunday * DAY;
  const isWeekend = weekday === 0 || weekday === 6;
  const saturdayStart = sundayStart - DAY;
  return {
    startsAt: iso(isWeekend ? now.getTime() : saturdayStart),
    endsAt: iso(sundayStart + DAY - 1000),
  };
}

function splitIds(value: string | null): string[] {
  return (value ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

export function salePrefill(params: URLSearchParams): { designs: string[]; services: string[] } {
  return { designs: splitIds(params.get("designs")), services: splitIds(params.get("services")) };
}

export function describeSaleRule(
  rule: AdminSaleRule,
  formatMoney: (n: number) => string,
  t: (key: "fixed" | "percent", values: Record<string, string | number>) => string,
): string {
  return rule.type === "FIXED"
    ? t("fixed", { amount: formatMoney(rule.value) })
    : t("percent", { percent: rule.value });
}

/** Tokyo calendar date ("YYYY-MM-DD") and minute ("HH:MM") of a UTC instant. */
export function tokyoParts(iso: string): { date: string; time: string } {
  const local = new Date(new Date(iso).getTime() + TOKYO_OFFSET).toISOString();
  return { date: local.slice(0, 10), time: local.slice(11, 16) };
}

/** The UTC ISO string for a Tokyo date and minute. */
export function fromTokyoParts(date: string, time: string): string {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  return new Date(Date.UTC(year, month - 1, day, hour, minute) - TOKYO_OFFSET).toISOString();
}

// -- The sale form ------------------------------------------------------------------

export const SALE_NAME_MAX = 120;
const MAX_FIXED_PRICE = 100_000_000;

/** The API fields a `SALE_INVALID` reply can name, so each error shows under its own field. */
export type SaleField = "name" | "startsAt" | "endsAt" | "rule" | "scope";

/**
 * One block of "Áp dụng cho". GROUPS is tiers for designs and categories for services. Group
 * and item picks are kept apart, so switching modes back and forth loses neither.
 */
export type SaleFormScope = {
  readonly mode: "NONE" | "ALL" | "GROUPS" | "ITEMS";
  readonly groupIds: ReadonlyArray<string>;
  readonly itemIds: ReadonlyArray<string>;
};

export type SaleForm = {
  readonly name: string;
  readonly startsAt: string;
  readonly endsAt: string;
  readonly ruleType: AdminSaleRule["type"];
  /** As typed; parsed on save. */
  readonly ruleValue: string;
  readonly designs: SaleFormScope;
  readonly services: SaleFormScope;
};

const NO_SCOPE: SaleFormScope = { mode: "NONE", groupIds: [], itemIds: [] };

function pickedScope(ids: ReadonlyArray<string>): SaleFormScope {
  return ids.length > 0 ? { mode: "ITEMS", groupIds: [], itemIds: ids } : NO_SCOPE;
}

/** A blank sale on the "7 ngày" window; ids from the tables' "Tạo sale" bar start picked. */
export function newSaleForm(
  now: Date,
  prefill: { designs: ReadonlyArray<string>; services: ReadonlyArray<string> } = { designs: [], services: [] },
): SaleForm {
  return {
    name: "",
    ...saleWindowPreset("week", now),
    ruleType: "FIXED",
    ruleValue: "",
    designs: pickedScope(prefill.designs),
    services: pickedScope(prefill.services),
  };
}

function scopeToForm(scope: AdminSaleScope<string>): SaleFormScope {
  if (scope.mode === "NONE" || scope.mode === "ALL") return { mode: scope.mode, groupIds: [], itemIds: [] };
  if (scope.mode === "ITEMS") return { mode: "ITEMS", groupIds: [], itemIds: scope.ids };
  return { mode: "GROUPS", groupIds: scope.ids, itemIds: [] };
}

export function saleFormFromSale(sale: AdminSale): SaleForm {
  return {
    name: sale.name,
    startsAt: sale.startsAt,
    endsAt: sale.endsAt,
    ruleType: sale.rule.type,
    ruleValue: String(sale.rule.value),
    designs: scopeToForm(sale.designs),
    services: scopeToForm(sale.services),
  };
}

/** "Nhân bản": the same rule and items under `name`, on a fresh window rather than the old dates. */
export function duplicateSaleForm(sale: AdminSale, name: string, now: Date): SaleForm {
  return { ...saleFormFromSale(sale), name: name.slice(0, SALE_NAME_MAX), ...saleWindowPreset("week", now) };
}

/** The rule as the API accepts it (whole yen 1–100,000,000, or 1–99 %), or null. */
export function parseSaleRule(form: Pick<SaleForm, "ruleType" | "ruleValue">): AdminSaleRule | null {
  if (form.ruleType === "FIXED") {
    const value = parseWholeYen(form.ruleValue);
    return value !== null && value >= 1 && value <= MAX_FIXED_PRICE ? { type: "FIXED", value } : null;
  }
  const plain = form.ruleValue.trim().replace(/\s*%$/, "");
  const value = /^\d{1,2}$/.test(plain) ? Number(plain) : 0;
  return value >= 1 && value <= 99 ? { type: "PERCENT", value } : null;
}

function scopeIsPicked(scope: SaleFormScope): boolean {
  if (scope.mode === "GROUPS") return scope.groupIds.length > 0;
  if (scope.mode === "ITEMS") return scope.itemIds.length > 0;
  return true;
}

/** The same rules the API checks, keyed by the field the error belongs under. */
export function saleFormErrors(form: SaleForm): Partial<Record<SaleField, true>> {
  const errors: Partial<Record<SaleField, true>> = {};
  const name = form.name.trim();
  if (name.length === 0 || name.length > SALE_NAME_MAX) errors.name = true;
  if (new Date(form.endsAt).getTime() <= new Date(form.startsAt).getTime()) errors.endsAt = true;
  if (!parseSaleRule(form)) errors.rule = true;
  const nothingApplied = form.designs.mode === "NONE" && form.services.mode === "NONE";
  if (nothingApplied || !scopeIsPicked(form.designs) || !scopeIsPicked(form.services)) errors.scope = true;
  return errors;
}

function toApiScope<M extends string>(scope: SaleFormScope, groupMode: M): AdminSaleScope<M> {
  if (scope.mode === "GROUPS") return { mode: groupMode, ids: scope.groupIds };
  if (scope.mode === "ITEMS") return { mode: "ITEMS", ids: scope.itemIds };
  return { mode: scope.mode, ids: [] };
}

/** The form's two blocks as the API scopes them; read by the preview before the rule is filled. */
export function saleFormScopes(form: SaleForm): Pick<AdminSaleInput, "designs" | "services"> {
  return { designs: toApiScope(form.designs, "TIERS"), services: toApiScope(form.services, "CATEGORIES") };
}

/** What the form sends; null while the rule cannot be read. */
export function buildSaleInput(form: SaleForm): AdminSaleInput | null {
  const rule = parseSaleRule(form);
  if (!rule) return null;
  return { name: form.name.trim(), startsAt: form.startsAt, endsAt: form.endsAt, rule, ...saleFormScopes(form) };
}

// -- Coverage and preview -------------------------------------------------------------

/** A design or base service as the sale screen sees it. `groupId` is its tier or category. */
export type SaleTarget = {
  readonly id: string;
  readonly groupId: string | null;
  readonly name: string;
  readonly price: number | null;
  readonly imageUrl?: string | null;
};

/** Where a list the form picks from stands: still loading, failed to load, or ready. */
export type SaleOptionsStatus = "loading" | "failed" | "ready";

/** Loading while any read is, failed if any read failed, otherwise ready. */
export function saleOptionsStatus(...reads: ReadonlyArray<{ readonly isLoading: boolean; readonly error?: unknown }>): SaleOptionsStatus {
  if (reads.some((read) => read.isLoading)) return "loading";
  return reads.some((read) => Boolean(read.error)) ? "failed" : "ready";
}

/** Each list the sale form reads, and `preview` for designs and services together. */
export type SaleFormStatus = Readonly<Record<"designs" | "services" | "tiers" | "categories" | "preview", SaleOptionsStatus>>;

/** How many sales pick designs by this tier, so deleting the tier can say what it changes. */
export function salesOnTier(sales: ReadonlyArray<Pick<AdminSale, "designs">>, tierId: string): number {
  return sales.filter((sale) => sale.designs.mode === "TIERS" && sale.designs.ids.includes(tierId)).length;
}

/** A design as a sale target: its tier is the group, its cover photo the thumbnail. */
export function designTarget(design: AdminNailDesign): SaleTarget {
  return {
    id: design.id,
    groupId: design.priceTierId ?? null,
    name: design.title,
    price: typeof design.indicativePrice === "number" ? design.indicativePrice : null,
    imageUrl: design.thumbnailUrl ?? design.images?.[0] ?? null,
  };
}

/** A base service as a sale target: the group is the public category key a sale names. */
export function serviceTarget(service: AdminServiceItem): SaleTarget {
  return {
    id: service.id,
    groupId: service.categoryId ?? null,
    name: service.name,
    price: service.price,
    imageUrl: service.imageUrl ?? null,
  };
}

function folded(text: string): string {
  return text.normalize("NFD").replace(/\p{Diacritic}/gu, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase();
}

/** The picker's search: by name, ignoring case and Vietnamese accents. */
export function filterSaleTargets<T extends SaleTarget>(items: ReadonlyArray<T>, query: string): ReadonlyArray<T> {
  const needle = folded(query.trim());
  return needle ? items.filter((item) => folded(item.name).includes(needle)) : items;
}

function covers(scope: AdminSaleScope<string>, target: SaleTarget): boolean {
  if (scope.mode === "ALL") return true;
  if (scope.mode === "NONE") return false;
  if (scope.mode === "ITEMS") return scope.ids.includes(target.id);
  return target.groupId !== null && scope.ids.includes(target.groupId);
}

/** The designs and services a sale's scopes reach, the same way the API decides it. */
export function saleCoverage<T extends SaleTarget>(
  sale: Pick<AdminSaleInput, "designs" | "services">,
  designs: ReadonlyArray<T>,
  services: ReadonlyArray<T>,
): { designs: T[]; services: T[] } {
  return {
    designs: designs.filter((target) => covers(sale.designs, target)),
    services: services.filter((target) => covers(sale.services, target)),
  };
}

/**
 * How many designs and services a sale actually lowers: covered, priced, and cheaper under its
 * rule. This is what the tables mark SALE, so the list's count matches them.
 */
export function saleLoweredCounts(
  sale: Pick<AdminSaleInput, "designs" | "services" | "rule">,
  designs: ReadonlyArray<SaleTarget>,
  services: ReadonlyArray<SaleTarget>,
): { designs: number; services: number } {
  const covered = saleCoverage(sale, designs, services);
  const lowered = (targets: ReadonlyArray<SaleTarget>) =>
    targets.filter((target) => target.price !== null && previewSalePrice(target.price, sale.rule).applies).length;
  return { designs: lowered(covered.designs), services: lowered(covered.services) };
}

export type SalePreviewRow<T extends SaleTarget = SaleTarget> = {
  readonly target: T;
  readonly original: number;
  readonly price: number;
  readonly applies: boolean;
};

/**
 * The first `limit` priced items with their sale price, how many priced items the sale reaches,
 * and how many of those a fixed price would not lower (they keep their own price).
 */
export function salePreview<T extends SaleTarget>(
  targets: ReadonlyArray<T>,
  rule: AdminSaleRule,
  limit = 6,
): { rows: SalePreviewRow<T>[]; total: number; notCheaper: number } {
  const priced = targets.flatMap((target) =>
    target.price === null ? [] : [{ target, original: target.price, ...previewSalePrice(target.price, rule) }],
  );
  return {
    rows: priced.slice(0, limit),
    total: priced.length,
    notCheaper: priced.filter((row) => !row.applies).length,
  };
}
