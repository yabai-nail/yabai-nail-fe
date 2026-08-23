# Tasks: Admin Full API Wiring

Plan: `docs/plans/admin-full-wiring-plan.md`. Spec: `docs/specs/SPEC-admin-full-wiring.md`.

Grep script để đo tiến độ:

```bash
# BE admin ops (106)
sed -n '/^const source = `/,/^`$/p' ../yabai-nail-platform/apps/api/src/platform/operation-registry.ts | grep -E "^(GET|POST|PUT|PATCH|DELETE) /api/v1/admin/" | sort -u | wc -l

# adminService methods used somewhere in src/components (target ≥ 85 of ~101)
grep -roh -E "adminService\.[a-zA-Z]+" src/components src/app | sort -u | wc -l
```

---

## Phase 0 — Foundation cleanup

- [~] **T0.1** SKIPPED — `GET /api/v1/admin/reviews` là compat route hợp pháp, không stale.
  - Acceptance: `adminService.reviews` và `useAdminReviews` không còn trong `src/service/admin/*`; không caller nào ngoài `branchReviews`/`useAdminBranchReviews`.
  - Verify: `pnpm test`, `pnpm build`.
  - Files: `src/service/admin/service.ts`, `src/service/admin/hooks.ts`, test tương ứng.

- [~] **T0.2** DEFERRED — chưa có 3+ consumer, inline `mutate()` theo Rule 0 skill incremental-implementation.
  - Acceptance: export từ `src/service/admin/index.ts`, dùng được trong component; đơn vị test khớp key predicate.
  - Verify: unit test + `pnpm typecheck` implicit qua build.
  - Files: `src/service/admin/index.ts` (thêm), test mới cùng chỗ.

### Checkpoint 0

- [ ] `pnpm lint && pnpm test && pnpm build` green.

---

## Phase 1 — Appointment lifecycle

- [x] **T1.1** Wire status transitions
  - Acceptance: nút Check-in / Bắt đầu / Hoàn tất / No-show hiển thị theo status và gọi API đúng; hiện error inline khi fail; disable khi pending.
  - Verify: BE local → click qua đủ vòng đời `CONFIRMED → CHECKED_IN → IN_SERVICE → AWAITING_PAYMENT`.
  - Files: `src/components/pages/admin/AdminAppointments/AppointmentDetailPanel.tsx`, `component.tsx`, test.

- [x] **T1.2** Wire assignment change
  - Acceptance: modal chọn nhân viên dùng `useAdminAppointmentAllocationCandidates`; save gọi `assignAppointment` với `version`; revalidate list.
  - Verify: BE 200 → detail panel hiển thị nhân viên mới.
  - Files: `AppointmentDetailPanel.tsx`, new `AssignStaffModal.tsx`, `component.tsx`.

- [x] **T1.3** Wire actual-services + photos
  - Acceptance: chỉnh dịch vụ thực tế qua modal → PUT 200; upload URL ảnh → POST 200; danh sách render sau revalidate.
  - Verify: BE local, kiểm tra `AppointmentServiceEntity` có row mới.
  - Files: `AppointmentDetailPanel.tsx`, `ActualServicesModal.tsx` (new), `PhotosPanel.tsx` (new hoặc inline).

### Checkpoint 1

- [ ] Vòng đời appointment chạy end-to-end với BE.
- [ ] Tắt BE giữa chừng → UI báo lỗi, không crash.

---

## Phase 2 — Customers CRM

- [x] **T2.1** Wire customer detail + update (edit modal; useAdminCustomer defer — list row đủ)
  - Acceptance: `CustomerDetailPanel` render từ `useAdminCustomer`; nút "Lưu" gọi `updateCustomer` với version; success revalidate.
  - Verify: sửa displayName → BE lưu, list refresh.
  - Files: `AdminCustomers/CustomerDetailPanel.tsx`, `component.tsx`.

- [x] **T2.2** Wire notes CRUD
  - Acceptance: list notes từ API; create/update note có form + button; error inline.
  - Verify: BE ghi `customer_notes` (domain_records với kind phù hợp).
  - Files: `CustomerDetailPanel.tsx` (tab Notes), `CustomerNoteEditor.tsx` (new).

- [x] **T2.3** Wire loyalty ops (benefits + points + coupon + nail-history); lookup deferred to when a picker consumer exists
  - Acceptance: tab "Ưu đãi" hiển thị benefits + coupon; button "Cộng điểm/Trừ điểm" gọi `adjustCustomerPoints`; "Phát coupon" gọi `issueCustomerCoupon`; lookup dùng cho search input.
  - Verify: point_transactions có row mới; customer_coupons có row.
  - Files: `CustomerDetailPanel.tsx`, `LoyaltyActions.tsx` (new), `CustomerLookupField.tsx` (dùng chung nếu đủ thời gian).

### Checkpoint 2

- [ ] Detail chạy full API. Cộng điểm phản ánh ngay trên UI.

---

## Phase 3 — Services + catalog

- [x] **T3.1** Wire service update
  - Acceptance: nút edit trong `ServiceTable` mở modal; PATCH với version; success revalidate + đóng modal.
  - Verify: sửa giá → list hiển thị giá mới.
  - Files: `AdminServices/ServiceTable.tsx`, `ServiceEditModal.tsx` (new hoặc reuse `ServiceCreateModal`).

- [x] **T3.2** Wire service-categories (list + create + rename); reorder deferred (needs DnD kit)
  - Acceptance: sidebar list từ API; create/update/reorder gọi API; UI thay bằng skeleton khi loading.
  - Verify: category mới xuất hiện trong filter bar page và trong modal edit service.
  - Files: `AdminServices/ServiceSidebar.tsx`, `CategoryEditor.tsx` (new).

- [x] **T3.3** Wire surcharges CRUD
  - Acceptance: tab hoặc panel mới liệt kê surcharges + create/edit.
  - Verify: BE `surcharges` collection có row.
  - Files: `AdminServices/component.tsx`, `SurchargePanel.tsx` (new).

### Checkpoint 3

- [ ] Sửa 1 dịch vụ + thêm 1 category → phản ánh full UI.

---

## Phase 4 — Staff depth

- [x] **T4.1** Wire staff update + compensation write
  - Acceptance: form edit trong detail panel; save gọi `updateStaff` + `setStaffCompensation`.
  - Verify: compensation config lưu, `useStaffCompensation` trả về giá trị mới.
  - Files: `AdminStaff/StaffDetailPanel.tsx`, `StaffEditForm.tsx` (new).

- [x] **T4.2** Wire staff skills
  - Acceptance: tab "Kỹ năng" list services (từ `useAdminServices`) với checkbox; save gọi `setStaffSkills`.
  - Verify: cùng nhân viên xuất hiện trong allocation-candidates của service mới tick.
  - Files: `StaffDetailPanel.tsx`, `StaffSkillsTab.tsx` (new).

- [x] **T4.3** Wire shifts + leave (create + list; decide-leave defer — needs manager approval UI)
  - Acceptance: list shifts tuần hiện tại; nút "Thêm ca" + "Xin nghỉ"; owner có nút "Duyệt/Từ chối" leave.
  - Verify: shift entry trong `staff_shifts`.
  - Files: `StaffDetailPanel.tsx`, `ShiftsPanel.tsx`, `LeaveDialog.tsx` (new).

- [x] **T4.4** Wire staff-performance
  - Acceptance: tab "Hiệu suất" dùng `useAdminStaffPerformance` (period=YYYY-MM); loading/error/empty state đủ.
  - Verify: manual — chọn period, số liệu render.
  - Files: `StaffDetailPanel.tsx`, `PerformancePanel.tsx` (new).

### Checkpoint 4

- [ ] Sửa hoa hồng + tick kỹ năng → phản ánh; performance tab hiển thị số thật.

---

## Phase 5 — Payments extras

- [x] **T5.1** Wire payment-quote — Phase 5 done
  - Acceptance: trước "Xác nhận thanh toán", gọi `requestAppointmentPaymentQuote` với line items → hiển thị breakdown BE; nút confirm gửi `recordAppointmentPayment` với quote id/version.
  - Verify: hai bước, PaymentQuote ghi + Payment ghi trong DB.
  - Files: `AdminPayments/component.tsx`, `PaymentConfirmationDialog.tsx`, `payment-state.ts`.

### Checkpoint 5

- [ ] Payment happy path: quote → confirm chạy đủ, số hiển thị bằng số BE.

---

## Phase 6 — Messages polish

- [x] **T6.1** Wire conversation update — Phase 6 done
  - Acceptance: dropdown nhỏ trên mỗi conversation với "Đánh dấu đã đọc" / "Lưu trữ"; PATCH kèm `If-Match`; optimistic decrement unread.
  - Verify: badge unread biến mất, list revalidate.
  - Files: `AdminMessages/ConversationList.tsx`, `component.tsx`.

### Checkpoint 6

- [ ] Mark read + archive chạy được.

---

## Phase 7 — Settings + Dashboard drill-down

- [ ] **T7.1** Wire branch settings read/write
  - Acceptance: `useAdminBranchSettings` render form; save gọi `updateBranchSettings` với version; giới hạn 3–5 field ban đầu (booking window, cancellation policy, message templates on/off).
  - Verify: BE settings đổi, load lại đúng.
  - Files: `AdminSettings/component.tsx`, `SettingsForm.tsx` (new).

- [ ] **T7.2** Dashboard drill-down
  - Acceptance: card upcoming appointment click → navigate `/admin/appointments?id={id}`; page appointments đọc query, select đúng detail.
  - Verify: click từ dashboard → detail panel hiện đúng appointment.
  - Files: `AdminDashboard/AppointmentsPanel.tsx`, `AdminAppointments/component.tsx`.

### Checkpoint 7 — Full wiring done

- [ ] `pnpm lint && pnpm test && pnpm build` green.
- [ ] `grep -roh -E "adminService\.[a-zA-Z]+" src/components src/app | sort -u | wc -l` ≥ 85.
- [ ] Smoke test 6 module với BE local (login manager `0900000002`).
- [ ] Update spec `Trạng thái` → "hoàn tất và kiểm chứng ngày YYYY-MM-DD".
