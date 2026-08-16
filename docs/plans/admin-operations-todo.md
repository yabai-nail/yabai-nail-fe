# Tasks: Admin Operations Screens

- [x] `AO-01` Shared admin utilities
  - Acceptance: Có formatter VND và shared layout/status primitives chỉ cho contract dùng từ hai màn trở lên.
  - Verify: Pure cases + TypeScript.
  - Files: tối đa 5 file trong `src/components/blocks/admin` và `src/lib`.

- [x] `AO-02` Customers fixtures and route shell
  - Depends on: `AO-01`.
  - Acceptance: Route `200`, metadata/header đúng, sidebar link khả dụng.
  - Verify: Typecheck và runtime route.
  - Files: route, `data.ts`, page component/index, admin config.

- [x] `AO-03` Customers table and detail interaction
  - Depends on: `AO-02`.
  - Acceptance: Search, tabs, selection, table và detail panel hoạt động.
  - Verify: Browser desktop/mobile.
  - Files: tối đa 4 file trong `AdminCustomers`.

- [x] `AO-04` Messages fixtures and inbox
  - Depends on: `AO-01`.
  - Acceptance: Route/menu hoạt động; search/filter/selection cập nhật thread.
  - Verify: Typecheck và browser interaction.
  - Files: route, data, component, conversation list, config.

- [x] `AO-05` Messages thread, composer and customer summary
  - Depends on: `AO-04`.
  - Acceptance: Thread đúng fixture; local send hoạt động; summary cập nhật theo conversation.
  - Verify: Keyboard/composer/browser checks.
  - Files: tối đa 4 file trong `AdminMessages`.

- [x] `AO-06` Staff KPI, fixtures and table
  - Depends on: `AO-01`.
  - Acceptance: Route/menu hoạt động; KPI/totals/table/filter khớp fixture.
  - Verify: Pure calculations, typecheck và browser.
  - Files: route, data, component, table, config.

- [x] `AO-07` Staff detail and recent orders
  - Depends on: `AO-06`.
  - Acceptance: Selection cập nhật detail; recent orders có semantic table/status.
  - Verify: Browser desktop/mobile.
  - Files: tối đa 3 file trong `AdminStaff`.

- [x] `AO-08` Services fixtures, filters and table
  - Depends on: `AO-01`.
  - Acceptance: Route/menu hoạt động; search/category/pagination lọc đúng fixture.
  - Verify: Typecheck và browser.
  - Files: route, data, component, table, config.

- [x] `AO-09` Services categories and ranking
  - Depends on: `AO-08`.
  - Acceptance: Category counts và ranking derive từ fixture; responsive sidebar đúng.
  - Verify: Derived-data checks và browser.
  - Files: tối đa 3 file trong `AdminServices`.

- [x] `AO-10` Settings commission screen
  - Depends on: `AO-06`.
  - Acceptance: Route/menu hoạt động; tabs, summary, table và derived totals đúng.
  - Verify: Pure calculation, typecheck và browser.
  - Files: route, data, component, table, config.

- [x] `AO-11` Settings guide, history and switches
  - Depends on: `AO-10`.
  - Acceptance: Formula guide, aside/history và local switches accessible.
  - Verify: Keyboard, switch state và responsive checks.
  - Files: tối đa 3 file trong `AdminSettings`.

- [x] `AO-12` Full responsive verification and review
  - Depends on: `AO-03`, `AO-05`, `AO-07`, `AO-09`, `AO-11`.
  - Acceptance: Tất cả routes/build/checks đạt; không có review finding bắt buộc.
  - Verify: Full matrix trong `docs/plans/admin-operations-plan.md`.
  - Files: docs/task status và targeted fixes nếu cần.

## Verification record — 2026-08-16

- Vitest: 6 files, 15 tests đạt.
- `next typegen`, TypeScript, ESLint và production build: đạt.
- Sáu route admin trả `200`; sidebar dùng SPA navigation và active state đúng route.
- Search/filter/selection, gửi tin nhắn local, pagination và switches: đạt.
- Selection sau filter tự chuyển sang record đầu tiên còn hiển thị; empty state không rò detail cũ.
- Kiểm tra 24 tổ hợp route/viewport tại 320, 768, 1024 và 1440px: không còn page-level overflow.
- Tabs Khách hàng/Tin nhắn giữ label và số đếm trên một hàng; vùng tabs tự cuộn ngang khi cần.
