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

- Kế thừa stack từ `SPEC-admin-foundation.md`; không thêm dependency hoặc tải ảnh ngoài.

```powershell
pnpm exec next typegen
pnpm exec tsc --noEmit
pnpm run lint
pnpm run build
```

## Project structure

```text
src/app/(admin)/admin/services/page.tsx
src/components/pages/AdminServices/
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
