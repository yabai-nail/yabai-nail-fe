# Spec: Admin Services

## Trạng thái

- Capability id: `admin-services`
- Trạng thái: Đã triển khai và kiểm chứng ngày 2026-08-16
- URL: `/admin/services`
- Phụ thuộc: `admin-foundation`

## Objective

Dựng màn quản lý dịch vụ gồm tab phân loại, search, bảng dịch vụ, danh mục và bảng xếp hạng dịch vụ bán chạy theo ảnh tham chiếu.

## Acceptance flow

1. Mở `/admin/services` và thấy tabs, search, nút thêm dịch vụ, service table và sidebar thống kê.
2. Search và category tabs lọc fixture theo tên/loại.
3. Bảng hiển thị dịch vụ, loại, giá, thời gian, trạng thái và action có accessible label.
4. Danh mục và top services phản ánh cùng fixture source, không lặp hard-coded data độc lập.
5. Pagination thay đổi trang fixture khi danh sách đủ dài.

## Tech stack and commands

- Kế thừa stack từ `docs/specs/SPEC-admin-foundation.md`; không thêm dependency hoặc tải ảnh ngoài.

```powershell
pnpm exec next typegen
pnpm exec tsc --noEmit
pnpm run lint
pnpm run build
```

## Project structure

```text
src/app/(admin)/admin/services/page.tsx
src/components/pages/admin/AdminServices/
├── component.tsx
├── data.ts
├── ServiceTable.tsx
├── ServiceCategories.tsx
├── TopServices.tsx
└── index.tsx
```

## Code style

```tsx
type SalonService = {
  readonly id: string;
  readonly name: string;
  readonly category: "primary" | "addon" | "combo";
  readonly price: number;
  readonly durationMinutes: number;
  readonly isVisible: boolean;
};
```

- Derive counts/ranking từ fixture; không duy trì hai nguồn dữ liệu.
- Component presentation nhỏ, typed props, stable id; không `any` hoặc inline style.

## Testing strategy

- Typecheck, lint, build và runtime `200`.
- Browser test search, tabs, pagination và active sidebar.
- Kiểm tra table semantics, icon-button labels, empty result và bốn viewport.

## Boundaries

- Always: HeroUI/Heroicons, VND, derived statistics, fixture typed.
- Ask first: upload ảnh, CRUD API, reorder bằng drag-and-drop, dependency mới.
- Never: copy ảnh dịch vụ từ screenshot, action xóa thật hoặc dữ liệu giá thật.

## Success criteria

- [x] Main table và right sidebar bám hierarchy/density ảnh.
- [x] Search, category filter và pagination hoạt động.
- [x] Counts/top services derive từ fixture nhất quán.
- [x] Sidebar bật link Dịch vụ và chuyển trang SPA.
- [x] Test, typecheck, lint, build và browser verification pass.

## Open questions

- Không còn câu hỏi mở; ảnh dịch vụ dùng placeholder nội bộ thay vì copy screenshot.

## Mức giá cho dịch vụ (2026-11-15)

Dịch vụ dùng chung bảng **Mức giá** của mẫu nail (`/admin/price-tiers`), không có hệ mức giá thứ hai.

- Hợp đồng API: dịch vụ đọc/tạo/sửa có `priceTierId: string | null`. Gửi id thì dịch vụ theo giá của mức (API bỏ qua `price` cùng body); `null` bỏ mức và giữ giá hiện tại hoặc `price` gửi kèm; PATCH không có `priceTierId` thì giữ nguyên liên kết. Sai id → 422 `PRICE_TIER_NOT_FOUND`. Add-on "Không dùng tùy chọn" (giá 0) không gắn được mức. Mức giá trả thêm `serviceCount`; sửa giá mức thì ghi lại giá mọi dịch vụ đang gắn, xoá mức thì bỏ gắn và giữ giá.
- Form tạo/sửa (cả dịch vụ chính và add-on): chọn "Theo mức giá" hoặc "Tự nhập giá". Tạo mới mặc định tự nhập, như trước. Bỏ mức thì ô giá điền sẵn giá của mức. `PRICE_TIER_NOT_FOUND` hiện ở ô chọn mức và tải lại danh sách mức.
- Tab **Mức giá** trên `/admin/services` dùng lại `PriceTierPanel`/`PriceTierModal`, có cột số mẫu nail và số dịch vụ; hộp xoá nói rõ số dịch vụ sẽ giữ giá. Bảng dịch vụ/add-on ghi "Theo mức: …" dưới giá.
- Quyền: đọc/ghi mức giá cần `design.manage.all`. Không có quyền này thì tab và ô chọn mức bị ẩn; dịch vụ đang gắn mức hiện ghi chú và giữ nguyên liên kết khi lưu.
- Sau mỗi lần ghi mức giá (từ màn nào cũng vậy), `useRevalidatePriceTierDependents` làm mới mọi cache SWR của mức giá, mẫu nail và dịch vụ. Lưu dịch vụ thì làm mới mức giá (đổi `serviceCount`).
- Test: `AdminServices/service-price.test.ts` (payload tạo/sửa/gắn/bỏ mức), `AdminServices/service-price-tiers.test.ts` (bỏ mức giữ giá, add-on không gắn được, lỗi mức đã xoá, làm mới cache, i18n).
