# Tasks: Admin Payments

## Trạng thái

- Đã duyệt ngày 2026-08-16; chưa implement.
- Bắt đầu implementation từ `AP-01` và giữ đúng dependency order trong plan.

## Phase 1 — Domain foundation

- [ ] `AP-01` Viết payment domain tests
  - Acceptance: Có failing tests cho subtotal, discount boundaries, split rounding, service swap, line items và paid lock.
  - Verify: `pnpm exec vitest run src/components/pages/admin/AdminPayments/payment-state.test.ts` fail đúng vì implementation chưa có.
  - Files: `payment-state.test.ts`, `data.ts`.
  - Scope: Small — 2 files.

- [ ] `AP-02` Implement contracts, fixtures và pure state helpers
  - Depends on: `AP-01`.
  - Acceptance: Invoice fixture typed/stable; integer money; helpers immutable; split luôn cộng lại đúng total; paid guard hoạt động.
  - Verify: Focused payment tests và `pnpm exec tsc --noEmit` pass.
  - Files: `data.ts`, `payment-state.ts`, `payment-state.test.ts`.
  - Scope: Medium — 3 files.

## Checkpoint A — Payment domain stable

- [ ] Tests bao phủ `0/60/100%`, số tiền lẻ, discount `0/subtotal/out-of-range` và duplicate service.
- [ ] Pure helpers không dùng React, browser API, floating currency hoặc fixture page khác.

## Phase 2 — Route and context

- [ ] `AP-03` Tạo route shell và bật navigation
  - Depends on: `AP-02`.
  - Acceptance: `/admin/payments` tồn tại; shell title đúng; sidebar active; link chỉ bật khi page render được.
  - Verify: Next typegen, TypeScript và runtime `GET /admin/payments` pass.
  - Files: route `page.tsx`, page `index.tsx`, `component.tsx`, `AdminShell/config.ts`.
  - Scope: Medium — 4 files.

- [ ] `AP-04` Dựng customer/appointment context
  - Depends on: `AP-03`.
  - Acceptance: Customer/appointment fields đầy đủ; đổi staff/date-time và cancel dùng local HeroUI overlays, không reload.
  - Verify: Browser content/actions/focus checks và TypeScript pass.
  - Files: `CustomerAppointmentPanel.tsx`, tối đa hai context overlay files, `component.tsx`.
  - Scope: Medium — tối đa 4 files.

## Checkpoint B — Context flow usable

- [ ] Route/sidebar/context render đúng và không action inert.
- [ ] Context transition không mutate fixture và không làm lệch invoice totals.

## Phase 3 — Service composition

- [ ] `AP-05` Dựng primary service comparison và selection
  - Depends on: `AP-02`, `AP-03`.
  - Acceptance: Booked/current service hiển thị đúng; selection Modal đổi current snapshot và trạng thái “Đã đổi”.
  - Verify: Unit service-swap tests + browser modal/selection/focus checks.
  - Files: `ServiceCheckoutPanel.tsx`, `ServiceSelectionModal.tsx`, `component.tsx`.
  - Scope: Medium — 3 files.

- [ ] `AP-06` Dựng additional/custom line item flow
  - Depends on: `AP-05`.
  - Acceptance: Add/edit/delete/custom hoạt động; required/price/duplicate validation rõ; stable id và immutable state.
  - Verify: Focused mutation tests + browser add/edit/delete/error checks.
  - Files: `LineItemModal.tsx`, `ServiceCheckoutPanel.tsx`, `payment-state.ts`, `payment-state.test.ts`.
  - Scope: Medium — 4 files.

## Checkpoint C — Invoice composition complete

- [ ] Dịch vụ chính và line items dùng một invoice source.
- [ ] Mọi mutation hợp lệ cập nhật subtotal; invalid mutation không thay state.

## Phase 4 — Totals and confirmation

- [ ] `AP-07` Dựng totals, discount và revenue split
  - Depends on: `AP-02`, `AP-06`.
  - Acceptance: Main/right summary cùng số; discount errors liên kết field; tỷ lệ luôn tổng 100%; split cộng đúng grand total.
  - Verify: Calculation tests + browser discount/split checks.
  - Files: `PaymentSummaryPanel.tsx`, `component.tsx`, `payment-state.ts`, `payment-state.test.ts`.
  - Scope: Medium — 4 files.

- [ ] `AP-08` Dựng payment method và confirmation flow
  - Depends on: `AP-07`.
  - Acceptance: Radio selection required; AlertDialog tóm tắt đúng; confirm chuyển paid; money controls bị khóa.
  - Verify: Unit confirmation/paid-lock tests + browser keyboard/confirm/Escape/focus checks.
  - Files: `PaymentMethodPicker.tsx`, `PaymentConfirmationDialog.tsx`, `component.tsx`, `payment-state.test.ts`.
  - Scope: Medium — 4 files.

## Checkpoint D — Local payment flow complete

- [ ] Draft → paid hoạt động và reload khôi phục fixture.
- [ ] Không network payment request, credential input hoặc sensitive log.
- [ ] Paid invoice không thể đổi service/item/discount/split bằng UI hoặc helper.

## Phase 5 — Invoice and integration

- [ ] `AP-09` Dựng order note và invoice preview/print
  - Depends on: `AP-08`.
  - Acceptance: Note giới hạn 500 ký tự; preview có đủ line items/totals/method/split; print chỉ từ explicit action.
  - Verify: Browser preview/content/print-trigger/focus checks và lint pass.
  - Files: `InvoicePreviewModal.tsx`, `PaymentSummaryPanel.tsx`, `component.tsx`, print styles nếu cần.
  - Scope: Medium — tối đa 4 files.

- [ ] `AP-10` Nối dashboard entry points và polish responsive
  - Depends on: `AP-03`, `AP-09`.
  - Acceptance: Dashboard/sidebar chuyển SPA; hierarchy bám ảnh; chỉ vùng line items được internal scroll khi cần.
  - Verify: Browser navigation và visual checks tại bốn viewport.
  - Files: `AdminDashboard/UtilityPanel.tsx`, `component.tsx`, tối đa hai presentation files.
  - Scope: Medium — tối đa 4 files.

- [ ] `AP-11` Chạy full verification và review
  - Depends on: `AP-01` đến `AP-10`.
  - Acceptance: Full tests/type/lint/build/runtime/browser pass; không còn Critical/Required finding; docs phản ánh trạng thái thật.
  - Verify: Full matrix trong `docs/plans/admin-payments-plan.md`.
  - Files: targeted fixes và payment docs.
  - Scope: Small — verification/documentation.

## Checkpoint E — Ready for human review

- [ ] Tất cả success criteria trong spec đã được kiểm chứng và đánh dấu.
- [ ] Verification record có số test, route và viewport thực tế.
- [ ] Working tree sạch; commits tách theo vertical slice.
