# Spec: Admin Customers

## Trạng thái

- Capability id: `admin-customers`
- Trạng thái: Đã triển khai và kiểm chứng ngày 2026-08-16
- URL: `/admin/customers`
- Phụ thuộc: `admin-foundation`

## Objective

Dựng màn quản lý khách hàng bám sát ảnh tham chiếu: nhóm khách hàng, thanh tìm kiếm/lọc, bảng khách hàng và panel chi tiết khách đang chọn. Màn hình dùng fixture data để chủ tiệm có thể xem và thao tác thử luồng UI trước khi nối backend.

## Acceptance flow

1. Mở `/admin/customers` và thấy tiêu đề “Quản lý khách hàng”, tab phân nhóm, search, filter và nút thêm khách hàng.
2. Chuyển tab hoặc nhập từ khóa sẽ lọc dữ liệu fixture theo tên/số điện thoại.
3. Chọn một hàng sẽ đổi selected state và cập nhật panel chi tiết.
4. Bảng hiển thị tên, số điện thoại, lần đến gần nhất, tổng chi tiêu, điểm tích lũy và hạng.
5. Pagination hiển thị đúng trạng thái fixture; chưa gọi API.

## Tech stack and commands

- Kế thừa Next.js, React, TypeScript, HeroUI, Heroicons và Tailwind từ `docs/specs/SPEC-admin-foundation.md`.
- Không thêm dependency.

```powershell
pnpm exec next typegen
pnpm exec tsc --noEmit
pnpm run lint
pnpm run build
```

## Project structure

```text
src/app/(admin)/admin/customers/page.tsx
src/components/pages/admin/AdminCustomers/
├── component.tsx
├── data.ts
├── CustomerTable.tsx
├── CustomerDetailPanel.tsx
└── index.tsx
```

Shared toolbar/status/detail primitives chỉ được chuyển vào `components/blocks/admin` khi có consumer thứ hai.

## Code style

```tsx
type Customer = {
  readonly id: string;
  readonly name: string;
  readonly phone: string;
  readonly segment: "loyal" | "new" | "regular";
  readonly rank: "gold" | "silver" | "bronze" | "none";
};
```

- Fixture có stable id và type readonly.
- Local state nằm trong connected page component; table/detail là presentation component.
- Không dùng `any`, inline style, raw clickable `div` hoặc component trên 200 dòng.

## Testing strategy

- Typecheck, lint và production build.
- Runtime `GET /admin/customers` trả `200`.
- Browser test search, tab filter, chọn hàng và active sidebar.
- Kiểm tra table semantics, keyboard focus và responsive tại 320/768/1024/1440px.

## Boundaries

- Always: HeroUI/Heroicons, fixture typed, `next/link`, accessible labels, một `h1` do AdminShell sở hữu.
- Ask first: API, persistence, modal CRUD thật, dependency mới.
- Never: dữ liệu khách hàng thật, copy avatar từ ảnh, nút dùng clickable `div`.

## Success criteria

- [x] Route render đúng bố cục list/detail của ảnh.
- [x] Search, tabs và row selection hoạt động trên fixture.
- [x] Sidebar bật link Khách hàng và chuyển trang không reload.
- [x] Không page-level overflow; panel detail xuống dưới trên màn nhỏ.
- [x] Test, typecheck, lint, build và browser verification pass.

## Open questions

- Không còn câu hỏi mở; thao tác thêm/sửa/nhắn tin chỉ là UI trong giai đoạn fixture.
