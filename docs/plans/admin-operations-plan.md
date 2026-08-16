# Plan: Admin Operations Screens

## Trạng thái

- Capability map: `docs/specs/CAPABILITY-MAP-admin-operations.md` — đã duyệt.
- Specs: Customers, Messages, Staff, Services, Settings — đã duyệt.
- Plan: Đã triển khai và kiểm chứng ngày 2026-08-16.

## Mục tiêu

Triển khai năm màn nghiệp vụ admin theo ảnh tham chiếu trên nền `admin-foundation`, dùng HeroUI/Heroicons, typed fixtures và local UI state. Vitest được bổ sung để khóa các regression nghiệp vụ; không gọi backend và không tạo mutation thật.

## Dependency graph

```text
admin-foundation (done)
├── admin-customers
├── admin-messages
├── admin-staff
├── admin-services
└── admin-staff ──→ admin-settings

customers + staff + services
└── validate shared table/status/layout contracts
```

Build order:

`shared-utilities → admin-customers → admin-messages → admin-staff → admin-services → admin-settings → responsive-polish → verification-review`

## Architecture decisions

1. **Một connected component cho mỗi page.** File `component.tsx` giữ search/filter/selection local state; child components nhận typed props.
2. **Fixture riêng theo domain.** Mỗi module có `data.ts`; settings chỉ tái sử dụng contract/công thức commission từ staff, không import presentation component.
3. **Chia sẻ sau khi contract rõ.** Chỉ dùng chung currency formatter, status tone và split-layout/panel primitives có từ hai consumer; không tạo generic table schema phức tạp.
4. **Server route, client interaction island.** `page.tsx` và metadata là server-compatible; page component có `"use client"` khi cần state.
5. **URL state chưa cần thiết.** Search/filter/pagination là local state vì đây là fixture prototype; khi nối API sẽ chuyển sang search params.
6. **Route chỉ bật khi page tồn tại.** `isAvailable` được đổi thành `true` trong cùng task tạo route để menu không dẫn tới 404.
7. **No copied screenshot assets.** Avatar dùng initials; thumbnail dịch vụ dùng pattern/gradient nhẹ bằng CSS token, không sao chép ảnh.

## Vertical slices

### Slice 1 — Shared admin utilities

- Tạo formatter VND và small shared visual contracts có ít nhất hai consumer.
- Giữ `AdminPageLayout` là main landmark duy nhất.

Checkpoint: pure formatter cases pass; không tạo abstraction phụ thuộc domain.

### Slice 2 — Customers

- Route, metadata, typed fixtures.
- Tabs/search, selectable customer table và detail panel.
- Bật sidebar link Customers.

Checkpoint: search/filter/selection hoạt động; `/admin/customers` trả `200`.

### Slice 3 — Messages

- Route, conversations/messages/customer fixtures.
- Inbox filters, conversation selection, local message composer và customer summary.
- Bật sidebar link Messages.

Checkpoint: local send thêm đúng message và route chuyển SPA.

### Slice 4 — Staff

- Route, staff/order fixtures và derived commission totals.
- KPI, filters, table, detail panel, recent orders.
- Bật sidebar link Staff.

Checkpoint: totals khớp fixture; selection/filter hoạt động.

### Slice 5 — Services

- Route, service fixtures và derived category/top-service data.
- Search/category tabs, table, category panel, ranking và pagination.
- Bật sidebar link Services.

Checkpoint: counts/ranking có một nguồn dữ liệu; filters hoạt động.

### Slice 6 — Settings

- Route, settings/commission fixtures.
- Tabs, summary, commission table, guide, history và local switches.
- Bật sidebar link Settings.

Checkpoint: commission formula/totals nhất quán với staff contract.

### Slice 7 — Responsive and review

- Kiểm tra density/alignment so với ảnh ở 1440px.
- Tablet/mobile: toolbar wrap, table scroll trong vùng có chủ đích, aside xuống dưới.
- Thực hiện five-axis review và sửa mọi finding bắt buộc.

## Verification matrix

```powershell
pnpm test
pnpm exec next typegen
pnpm exec tsc --noEmit
pnpm run lint
pnpm run build
```

- Routes: `/admin`, `/admin/customers`, `/admin/messages`, `/admin/staff`, `/admin/services`, `/admin/settings` trả `200`.
- Public routes hiện tại tiếp tục trả `200`.
- Browser: 320×800, 768×1024, 1024×768, 1440×900.
- Interactions: sidebar SPA navigation, filters/search, selected row/thread, local send, pagination, switches.
- Accessibility: một `h1`, table headers, labels, focus order, icon-button names, no page-level overflow.

## Risks and mitigation

| Risk | Mitigation |
|---|---|
| Năm màn tạo diff quá lớn | Triển khai và kiểm chứng từng vertical slice trước khi chuyển module |
| Generic table làm code khó đọc | Giữ table theo domain; chỉ chia sẻ formatter/layout/status primitive |
| Client components quá lớn | Tách container, table/list và detail panel; giới hạn khoảng 200 dòng/file |
| Số liệu giữa Staff/Settings lệch | Dùng một commission contract và pure calculation helper |
| UI desktop đẹp nhưng mobile khó dùng | Kiểm tra breakpoint sau từng route, không đợi đến cuối |

## Completion gate

- Tất cả checklist trong năm spec đạt.
- Không có Critical/Required review finding.
- Không thêm runtime dependency hoặc backend call; Vitest là dev dependency đã được duyệt để khóa regression.
- Docs/task list phản ánh đúng trạng thái triển khai.
