# Tasks: Admin Appointments

## Trạng thái

- Hoàn tất ngày 2026-08-16.
- Spec và plan đã được người dùng duyệt trước khi bắt đầu `AA-01`.

## Phase 1 — Domain foundation

- [x] `AA-01` Viết appointment domain tests
  - Acceptance: Có failing tests cho filter/sort/range, summary, conflict và create/edit/cancel immutable state.
  - Verify: `pnpm test -- src/components/pages/AdminAppointments/appointment-state.test.ts` fail đúng vì implementation chưa có.
  - Files: `appointment-state.test.ts`, `data.ts`.
  - Scope: Small — 2 files.

- [x] `AA-02` Implement contracts, fixtures và pure state helpers
  - Depends on: `AA-01`.
  - Acceptance: Fixture typed/stable; helper không mutate; conflict chỉ chặn overlap của cùng staff và hỗ trợ `excludeId` khi edit.
  - Verify: Focused appointment tests và `pnpm exec tsc --noEmit` pass.
  - Files: `data.ts`, `appointment-state.ts`, `appointment-state.test.ts`.
  - Scope: Medium — 3 files.

## Checkpoint A — Domain stable

- [x] Focused tests xanh và bao phủ boundary time liền kề/overlap.
- [x] Không dùng React, browser API hoặc dữ liệu page module khác trong pure helpers.

## Phase 2 — Route and daily schedule

- [x] `AA-03` Tạo route shell và bật navigation
  - Depends on: `AA-02`.
  - Acceptance: `/admin/appointments` tồn tại; shell title đúng; sidebar active; link chỉ bật khi page render được.
  - Verify: `pnpm exec next typegen`, TypeScript và runtime `GET /admin/appointments` pass.
  - Files: route `page.tsx`, page `index.tsx`, `component.tsx`, `AdminShell/config.ts`.
  - Scope: Medium — 4 files.

- [x] `AA-04` Dựng toolbar, status filter và daily list/summary
  - Depends on: `AA-03`.
  - Acceptance: Previous/next/today, status filter, sorted list và derived summary hoạt động; selected id fallback theo visible set.
  - Verify: Unit tests + browser date/filter/selection checks.
  - Files: `AppointmentToolbar.tsx`, `AppointmentList.tsx`, `component.tsx`, `appointment-state.test.ts`.
  - Scope: Medium — 4 files.

## Checkpoint B — Daily flow usable

- [x] Route/menu/date/filter/list/summary hoạt động không reload.
- [x] Empty state không hiển thị detail cũ.
- [x] Tests và TypeScript pass.

## Phase 3 — Calendar and detail

- [x] `AA-05` Dựng day/week/month calendar views
  - Depends on: `AA-04`.
  - Acceptance: Ba tabs render đúng view; appointment blocks derive từ visible data; click block cập nhật selection.
  - Verify: Browser tabs/selection tại desktop và mobile; không page-level overflow.
  - Files: `AppointmentCalendar.tsx` và tối đa ba calendar view files.
  - Scope: Medium — tối đa 4 files.

- [x] `AA-06` Dựng detail panel và message action
  - Depends on: `AA-04`, `AA-05`.
  - Acceptance: Detail phản ánh đúng appointment đang chọn; customer/appointment fields đầy đủ; message action chuyển SPA tới `/admin/messages`.
  - Verify: Browser chọn từ list/calendar, keyboard focus và navigation checks.
  - Files: `AppointmentDetailPanel.tsx`, `component.tsx`.
  - Scope: Small — 2 files.

## Checkpoint C — Read-only screen complete

- [x] Hierarchy ba vùng bám ảnh tham chiếu tại 1440px.
- [x] Ngày/Tuần/Tháng và detail dùng cùng selected state.
- [x] 320/768/1024/1440px không có page-level overflow.

## Phase 4 — Local management

- [x] `AA-07` Dựng create/edit appointment Modal
  - Depends on: `AA-02`, `AA-06`.
  - Acceptance: Required fields, end-after-start và staff conflict validation hoạt động; create/edit cập nhật local state và giữ selection hợp lệ.
  - Verify: Unit mutation tests + browser create/edit/form-error/focus-return checks.
  - Files: `AppointmentFormModal.tsx`, `component.tsx`, `appointment-state.ts`, `appointment-state.test.ts`.
  - Scope: Medium — 4 files.

- [x] `AA-08` Dựng cancel confirmation flow
  - Depends on: `AA-07`.
  - Acceptance: AlertDialog yêu cầu xác nhận; cancel đổi status thay vì xóa; list/calendar/detail/summary cập nhật đồng bộ.
  - Verify: Unit cancel test + browser confirm/cancel/Escape/focus-return checks.
  - Files: `CancelAppointmentDialog.tsx`, `component.tsx`, `appointment-state.test.ts`.
  - Scope: Medium — 3 files.

## Checkpoint D — Local CRUD complete

- [x] Create/edit/cancel và validation đạt trên fixture.
- [x] Reload khôi phục fixture gốc đúng boundary đã duyệt.
- [x] Modal/AlertDialog keyboard và focus management đạt.

## Phase 5 — Integration and verification

- [x] `AA-09` Nối dashboard entry points và polish responsive
  - Depends on: `AA-06`.
  - Acceptance: “Xem lịch” và entry point được duyệt chuyển SPA tới route mới; layout bám design tokens và chỉ calendar region scroll ngang.
  - Verify: Browser navigation + visual checks bốn viewport.
  - Files: `AdminDashboard/AppointmentsPanel.tsx`, tối đa hai appointment presentation files.
  - Scope: Medium — tối đa 3 files.

- [x] `AA-10` Chạy full verification và review
  - Depends on: `AA-07`, `AA-08`, `AA-09`.
  - Acceptance: Full tests/type/lint/build/runtime/browser pass; không còn Critical/Required finding.
  - Verify: Full matrix trong `docs/plans/admin-appointments-plan.md`.
  - Files: targeted fixes và docs status/checklist.
  - Scope: Small — verification/documentation.

## Checkpoint E — Ready for human review

- [x] Tất cả success criteria trong spec đã được kiểm chứng và đánh dấu.
- [x] Docs có verification record với số test, routes và viewport thực tế.
- [x] Working tree sạch; commits tách theo vertical slice.
