# Spec: Admin Staff

## Trạng thái

- Capability id: `admin-staff`
- Trạng thái: Đã triển khai và kiểm chứng ngày 2026-08-16
- URL: `/admin/staff`
- Phụ thuộc: `admin-foundation`

## Objective

Dựng màn quản lý nhân viên với KPI doanh thu/hoa hồng/thực nhận, bảng nhân viên, panel chi tiết và danh sách đơn hàng gần đây theo ảnh tham chiếu.

## Acceptance flow

1. Mở `/admin/staff` và thấy bốn KPI, tabs trạng thái, bộ lọc ngày và bảng nhân viên.
2. Tabs lọc nhân viên đang làm/nghỉ phép trên fixture.
3. Chọn hàng cập nhật panel chi tiết và thống kê tương ứng.
4. Bảng đơn gần đây hiển thị khách, dịch vụ, tổng tiền, hoa hồng, thực nhận và trạng thái.
5. Các số tiền được định dạng VND nhất quán.

## Tech stack and commands

- Kế thừa stack từ `docs/specs/SPEC-admin-foundation.md`; không thêm dependency.

```powershell
pnpm exec next typegen
pnpm exec tsc --noEmit
pnpm run lint
pnpm run build
```

## Project structure

```text
src/app/(admin)/admin/staff/page.tsx
src/components/pages/AdminStaff/
├── component.tsx
├── data.ts
├── StaffTable.tsx
├── StaffDetailPanel.tsx
├── RecentOrdersTable.tsx
└── index.tsx
```

## Code style

```tsx
type StaffMember = {
  readonly id: string;
  readonly name: string;
  readonly status: "working" | "leave";
  readonly revenue: number;
  readonly commissionRate: number;
};
```

- Tính tổng và format tiền qua pure helper dùng chung trong module.
- Container giữ filter/selection; presentation nhận typed props.
- Không dùng `any`, index key, inline style hoặc component trên 200 dòng.

## Testing strategy

- Typecheck, lint, build, runtime `200`.
- Kiểm tra phép tính fixture, tabs, row selection và active navigation.
- Kiểm tra semantic tables, labels, keyboard và bốn viewport mục tiêu.

## Boundaries

- Always: VND, typed fixture, HeroUI/Heroicons, text status.
- Ask first: payroll API, dữ liệu chấm công, sửa hoa hồng thật, export báo cáo.
- Never: dữ liệu lương thật, mutation backend hoặc công thức tài chính chưa được xác nhận.

## Success criteria

- [x] KPI, staff table, detail panel và recent orders đúng hierarchy ảnh.
- [x] Filters và selection hoạt động trên fixture.
- [x] Số liệu tổng khớp dữ liệu nguồn trong module.
- [x] Sidebar bật link Nhân viên và chuyển trang SPA.
- [x] Test, typecheck, lint, build và browser verification pass.

## Open questions

- Không còn câu hỏi mở; nút thêm/sửa và báo cáo chỉ hiển thị UI.
