import { paginate } from "@/lib/admin-pagination";
import { matchesSearch } from "@/lib/admin-search";
import type { AdminTableSort } from "@/lib/admin-table-sort";
import { UNGROUPED } from "./addon-groups";

/** The category a service belongs to, named by the admin API rather than by this file. */
export type ServiceCategoryRef = { readonly id: string; readonly name: string };

/** Filter value for the rows with no category, alongside the real category ids. */
export const UNCATEGORIZED = "none";

/**
 * The table's column filters. An empty list means "no filter" for that column, and several
 * ticked values match any of them, as in a spreadsheet's column filter.
 */
export type ServiceColumnFilters = {
  readonly categories: ReadonlyArray<string>;
  /** Add-on group codes; the add-ons tab's counterpart of `categories`. */
  readonly groups: ReadonlyArray<string>;
  readonly statuses: ReadonlyArray<ServiceStatusFilter>;
};

export type ServiceStatusFilter = "visible" | "hidden";

export const NO_COLUMN_FILTERS: ServiceColumnFilters = { categories: [], groups: [], statuses: [] };

export function hasColumnFilters(filters: ServiceColumnFilters): boolean {
  return Object.values(filters).some((values) => values.length > 0);
}

export type SalonService = {
  readonly id: string;
  readonly name: string;
  readonly nameJa?: string | null;
  readonly description?: string;
  readonly highlights?: readonly string[];
  // Null only for a row written before the backend made the category mandatory. The tabs
  // leave such a service out rather than filing it somewhere it does not belong.
  readonly category: ServiceCategoryRef | null;
  readonly imageUrl: string | null;
  readonly price: number;
  readonly durationMinutes: number;
  readonly warrantyDays?: number;
  readonly isVisible: boolean;
  readonly soldCount: number;
  readonly isFeatured?: boolean;
  /** Admin-only: kept at the top of the service table. */
  readonly isPinned?: boolean;
  readonly serviceType?: "BASE" | "ADD_ON";
  readonly addonGroup?: string | null;
  readonly bookableStandalone?: boolean;
  readonly representsNoSelection?: boolean;
  // Present only when adapted from useAdminServices; absent for fixture
  // rows so the edit affordance stays hidden in design-time preview.
  readonly version?: number;
};

const primary: ServiceCategoryRef = { id: "cat-primary", name: "Dịch vụ chính" };
const addon: ServiceCategoryRef = { id: "cat-addon", name: "Dịch vụ thêm" };
const combo: ServiceCategoryRef = { id: "cat-combo", name: "Combo" };

/** Fixture for the derivation tests only; the screen itself renders the live catalogue. */
export const salonServices: ReadonlyArray<SalonService> = [
  { id: "sv1", name: "Sơn gel đơn sắc", category: primary, imageUrl: null, price: 850000, durationMinutes: 90, isVisible: true, isFeatured: false, soldCount: 16 },
  { id: "sv2", name: "Sơn gel nâng cao", category: primary, imageUrl: null, price: 950000, durationMinutes: 90, isVisible: true, soldCount: 32 },
  { id: "sv3", name: "Thiết kế theo mẫu", category: primary, imageUrl: null, price: 1050000, durationMinutes: 120, isVisible: true, soldCount: 28 },
  { id: "sv4", name: "Gradient + Đính đá", category: primary, imageUrl: null, price: 1250000, durationMinutes: 120, isVisible: true, soldCount: 14 },
  { id: "sv5", name: "French Nail", category: primary, imageUrl: null, price: 900000, durationMinutes: 90, isVisible: true, soldCount: 12 },
  { id: "sv6", name: "Đắp bột", category: primary, imageUrl: null, price: 1100000, durationMinutes: 120, isVisible: true, soldCount: 18 },
  { id: "sv7", name: "Sơn gel ombre", category: primary, imageUrl: null, price: 1000000, durationMinutes: 120, isVisible: true, soldCount: 11 },
  { id: "sv8", name: "Sơn gel mắt mèo", category: primary, imageUrl: null, price: 1050000, durationMinutes: 120, isVisible: true, soldCount: 9 },
  { id: "sv9", name: "Đổ khuôn thành giả", category: addon, imageUrl: null, price: 100000, durationMinutes: 15, isVisible: true, soldCount: 8 },
  { id: "sv10", name: "Nối thêm móng (2 móng)", category: addon, imageUrl: null, price: 110000, durationMinutes: 20, isVisible: true, soldCount: 7 },
  { id: "sv11", name: "Gia cố móng (1 móng)", category: addon, imageUrl: null, price: 50000, durationMinutes: 10, isVisible: true, soldCount: 5 },
  { id: "sv12", name: "Thêm charm", category: addon, imageUrl: null, price: 30000, durationMinutes: 10, isVisible: true, soldCount: 4 },
  { id: "sv13", name: "Combo chăm sóc tay", category: combo, imageUrl: null, price: 1450000, durationMinutes: 150, isVisible: true, soldCount: 10 },
  { id: "sv14", name: "Combo gel cao cấp", category: combo, imageUrl: null, price: 1750000, durationMinutes: 180, isVisible: false, soldCount: 6 },
];

/**
 * Splits the one catalogue the API returns into the two things the screen shows separately.
 *
 * `GET /admin/services` has no serviceType filter, so both kinds arrive together and the tabs
 * narrow them here. A row with no serviceType predates the column and counts as a base
 * service: an add-on is only ever an add-on because something said so.
 */
export function selectBaseServices<T extends { readonly serviceType?: string }>(
  services: ReadonlyArray<T>,
): ReadonlyArray<T> {
  return services.filter((service) => service.serviceType !== "ADD_ON");
}

export function selectAddonServices<T extends { readonly serviceType?: string }>(
  services: ReadonlyArray<T>,
): ReadonlyArray<T> {
  return services.filter((service) => service.serviceType === "ADD_ON");
}

export function filterServices(
  services: ReadonlyArray<SalonService>,
  filters: ServiceColumnFilters,
  query: string,
) {
  return services.filter(
    (service) =>
      (filters.categories.length === 0 || filters.categories.includes(service.category?.id ?? UNCATEGORIZED)) &&
      (filters.groups.length === 0 || filters.groups.includes(service.addonGroup ?? UNGROUPED)) &&
      (filters.statuses.length === 0 || filters.statuses.includes(service.isVisible ? "visible" : "hidden")) &&
      matchesSearch(query, [service.name]),
  );
}

/** The table columns that can be clicked to sort. */
export type ServiceSortKey = "name" | "category" | "group" | "price" | "duration" | "soldCount" | "status";

const byName = (left: SalonService, right: SalonService) => left.name.localeCompare(right.name, "vi");

/** The number each plainly numeric column sorts by. */
const numericColumn: Record<"price" | "duration" | "soldCount" | "status", (service: SalonService) => number> = {
  price: (service) => service.price,
  duration: (service) => service.durationMinutes,
  soldCount: (service) => service.soldCount,
  // Ascending reads "visible first": the rows an admin usually wants on top.
  status: (service) => Number(!service.isVisible),
};

/**
 * Orders the already-filtered rows for the clicked column; null keeps the API's order. Ties fall
 * back to the name so equal prices do not shuffle between renders, and a service with no
 * category stays at the bottom in either direction because it is a data problem, not a value.
 */
export function sortServices(
  services: ReadonlyArray<SalonService>,
  sort: AdminTableSort<ServiceSortKey> | null,
): ReadonlyArray<SalonService> {
  if (!sort) return services;
  const { key } = sort;
  const sign = sort.direction === "asc" ? 1 : -1;
  return [...services].sort((left, right) => {
    if (key === "name") return sign * byName(left, right);
    if (key === "group") {
      return sign * (left.addonGroup ?? UNGROUPED).localeCompare(right.addonGroup ?? UNGROUPED) || byName(left, right);
    }
    if (key === "category") {
      if (!left.category || !right.category) return Number(!left.category) - Number(!right.category) || byName(left, right);
      return sign * left.category.name.localeCompare(right.category.name, "vi") || byName(left, right);
    }
    return sign * (numericColumn[key](left) - numericColumn[key](right)) || byName(left, right);
  });
}

/**
 * Pinned services first, whatever the column sort: a pin is the admin saying "keep this on
 * top". Both halves keep the order they arrived in, so a sort still applies within each.
 */
export function pinnedFirst(services: ReadonlyArray<SalonService>): ReadonlyArray<SalonService> {
  return [...services.filter((service) => service.isPinned), ...services.filter((service) => !service.isPinned)];
}

/** What one tab's list is showing: its search text, column filters, sort and page. */
export type ServiceListView = {
  readonly query: string;
  readonly filters: ServiceColumnFilters;
  readonly sort: AdminTableSort<ServiceSortKey> | null;
  readonly page: number;
};

export const SERVICE_PAGE_SIZE = 8;

/**
 * The page a tab shows. Search, filters, sort and pinning all run before paging, so they
 * apply across the whole list rather than within the page on screen; `total` is the count
 * after search and filters.
 */
export function listServices(
  services: ReadonlyArray<SalonService>,
  view: ServiceListView,
  { pinned = false }: { readonly pinned?: boolean } = {},
) {
  const sorted = sortServices(filterServices(services, view.filters, view.query), view.sort);
  return { ...paginate(pinned ? pinnedFirst(sorted) : sorted, view.page, SERVICE_PAGE_SIZE), total: sorted.length };
}

export function getPopularityWindow(now: Date = new Date()) {
  return {
    from: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString(),
    to: now.toISOString(),
  } as const;
}

/** Keeps the statistics list useful without conflating it with Admin's featured selection. */
export function getPopularServices(services: ReadonlyArray<SalonService>) {
  return [...services]
    .filter((service) => service.serviceType !== "ADD_ON" && service.isVisible && service.soldCount >= 3)
    .sort((left, right) => right.soldCount - left.soldCount || left.id.localeCompare(right.id));
}

export { paginate };
