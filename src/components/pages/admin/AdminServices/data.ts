import { matchesSearch } from "@/lib/admin-search";

export type ServiceCategory = "primary" | "addon" | "combo";
export type ServiceFilter = "all" | ServiceCategory;

export type SalonService = {
  readonly id: string;
  readonly name: string;
  readonly category: ServiceCategory;
  readonly price: number;
  readonly durationMinutes: number;
  readonly isVisible: boolean;
  readonly soldCount: number;
  // Present only when adapted from useAdminServices; absent for fixture
  // rows so the edit affordance stays hidden in design-time preview.
  readonly version?: number;
};

export const salonServices: ReadonlyArray<SalonService> = [
  { id: "sv1", name: "Sơn gel đơn sắc", category: "primary", price: 850000, durationMinutes: 90, isVisible: true, soldCount: 16 },
  { id: "sv2", name: "Sơn gel nâng cao", category: "primary", price: 950000, durationMinutes: 90, isVisible: true, soldCount: 32 },
  { id: "sv3", name: "Thiết kế theo mẫu", category: "primary", price: 1050000, durationMinutes: 120, isVisible: true, soldCount: 28 },
  { id: "sv4", name: "Gradient + Đính đá", category: "primary", price: 1250000, durationMinutes: 120, isVisible: true, soldCount: 14 },
  { id: "sv5", name: "French Nail", category: "primary", price: 900000, durationMinutes: 90, isVisible: true, soldCount: 12 },
  { id: "sv6", name: "Đắp bột", category: "primary", price: 1100000, durationMinutes: 120, isVisible: true, soldCount: 18 },
  { id: "sv7", name: "Sơn gel ombre", category: "primary", price: 1000000, durationMinutes: 120, isVisible: true, soldCount: 11 },
  { id: "sv8", name: "Sơn gel mắt mèo", category: "primary", price: 1050000, durationMinutes: 120, isVisible: true, soldCount: 9 },
  { id: "sv9", name: "Đổ khuôn thành giả", category: "addon", price: 100000, durationMinutes: 15, isVisible: true, soldCount: 8 },
  { id: "sv10", name: "Nối thêm móng (2 móng)", category: "addon", price: 110000, durationMinutes: 20, isVisible: true, soldCount: 7 },
  { id: "sv11", name: "Gia cố móng (1 móng)", category: "addon", price: 50000, durationMinutes: 10, isVisible: true, soldCount: 5 },
  { id: "sv12", name: "Thêm charm", category: "addon", price: 30000, durationMinutes: 10, isVisible: true, soldCount: 4 },
  { id: "sv13", name: "Combo chăm sóc tay", category: "combo", price: 1450000, durationMinutes: 150, isVisible: true, soldCount: 10 },
  { id: "sv14", name: "Combo gel cao cấp", category: "combo", price: 1750000, durationMinutes: 180, isVisible: false, soldCount: 6 },
];

/** Category ids only; their words live at admin.services.category.<id>. */
export const serviceCategories: ReadonlyArray<ServiceCategory> = ["primary", "addon", "combo"];

export function filterServices(
  services: ReadonlyArray<SalonService>,
  filter: ServiceFilter,
  query: string,
) {
  return services.filter(
    (service) =>
      (filter === "all" || service.category === filter) &&
      matchesSearch(query, [service.name]),
  );
}

export function paginateServices(
  services: ReadonlyArray<SalonService>,
  requestedPage: number,
  pageSize: number,
) {
  if (!Number.isInteger(pageSize) || pageSize <= 0) {
    throw new RangeError("Page size must be a positive integer.");
  }

  const pageCount = Math.max(1, Math.ceil(services.length / pageSize));
  const page = Math.min(Math.max(1, requestedPage), pageCount);

  return {
    items: services.slice((page - 1) * pageSize, page * pageSize),
    page,
    pageCount,
  } as const;
}
