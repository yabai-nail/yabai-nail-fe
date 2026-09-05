# Spec: Admin Settings

## Trạng thái

- Capability id: `admin-settings`
- Trạng thái: Đã triển khai và kiểm chứng ngày 2026-08-16; bổ sung tab Giao diện (sáng/tối) ngày 2026-09-05
- URL: `/admin/settings`
- Phụ thuộc: `admin-foundation`, `admin-staff`

## Objective

Dựng màn Cài đặt tập trung vào tab “Nhân viên & Hoa hồng”: summary metrics, bảng tỷ lệ hoa hồng, giải thích công thức, ghi chú/lịch sử thay đổi và cài đặt chung như ảnh tham chiếu.

## Acceptance flow

1. Mở `/admin/settings` và thấy settings tabs cùng tab Nhân viên & Hoa hồng đang active.
2. Summary metrics và bảng commission lấy từ cùng fixture staff/commission source.
3. Chọn tab khác chỉ thay active state và hiển thị trạng thái “đang phát triển”, không điều hướng 404.
4. Toggle cài đặt chung thay đổi local state và có accessible name/state.
5. Công thức hoa hồng và history được trình bày bằng semantic sections.
6. Tab Giao diện cho chọn Sáng / Tối / Theo hệ thống; lựa chọn do `next-themes` lưu trên trình duyệt, không gọi backend. Chọn Tối đổi toàn bộ token `--admin-*` (kể cả modal/popover portal ra ngoài shell) sang bảng màu tối dùng chung với site khách hàng.

## Tech stack and commands

- Kế thừa stack từ `docs/specs/SPEC-admin-foundation.md`; tái sử dụng type/fixture contract phù hợp từ `admin-staff`; không thêm dependency.

```powershell
pnpm exec next typegen
pnpm exec tsc --noEmit
pnpm run lint
pnpm run build
```

## Project structure

```text
src/app/(admin)/admin/settings/page.tsx
src/components/pages/admin/AdminSettings/
├── component.tsx
├── data.ts
├── CommissionTable.tsx
├── CommissionGuide.tsx
├── SettingsAside.tsx
└── index.tsx
```

## Code style

```tsx
type CommissionPolicy = {
  readonly staffId: string;
  readonly rate: number;
  readonly effectiveFrom: string;
  readonly personalRevenue: number;
};
```

- Derived values dùng pure helpers; không duplicate công thức giữa bảng và summary.
- Settings state là local UI state; không giả lập persistence.
- Không dùng `any`, inline style, index key hoặc component trên 200 dòng.

## Testing strategy

- Typecheck, lint, build và runtime `200`.
- Kiểm tra derived totals, tab selection, toggles và active navigation.
- Kiểm tra table semantics, switch labels/state, keyboard và bốn viewport.

## Boundaries

- Always: typed fixtures, cùng commission formula giữa staff/settings, HeroUI/Heroicons.
- Ask first: lưu cài đặt, payroll integration, authentication/authorization, thay công thức nghiệp vụ.
- Never: lưu localStorage như persistence thật, dữ liệu lương thật hoặc action mutation không cảnh báo.

## Success criteria

- [x] Settings tabs, summary, commission table, guide, aside và general settings đúng hierarchy ảnh.
- [x] Derived totals nhất quán với fixture staff.
- [x] Tabs và toggles hoạt động bằng local state.
- [x] Sidebar bật link Cài đặt và chuyển trang SPA.
- [x] Test, typecheck, lint, build và browser verification pass.
- [x] Tab Giao diện: 3 lựa chọn, server render không đoán theme (system + disabled tới khi hydrate), block `.dark` khai báo đủ mọi token của block sáng (test parity đọc thẳng `globals.css`).

## Open questions

- Không còn câu hỏi mở; các tab ngoài Nhân viên & Hoa hồng chỉ có placeholder có chủ đích.
