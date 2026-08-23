# Plan: Admin Full API Wiring

## Trạng thái

- Spec: `docs/specs/SPEC-admin-full-wiring.md` — khởi tạo 2026-08-23
- Task target: `docs/plans/admin-full-wiring-todo.md` (canonical), `tasks/todo.md` (mirror cho `/build`)
- Capability id: `admin-full-wiring`
- Branch: `feat/admin-full-wiring`

## Mục tiêu

Wire 84 method `adminService.*` chưa có consumer UI thành các mutation/read end-to-end trên 6 module admin đang có route. Sau plan này, tỉ lệ method có UI trigger tăng từ ~17% lên ≥ 85%.

## Architecture decisions

1. **Không refactor service layer.** `adminService` đã đúng shape; chỉ bổ sung test cho các method chưa test.
2. **Mutation pattern chung**: local `pending`/`error` state trong component + `try/catch` gọi service + `mutate(predicate)` từ `useSWRConfig` để revalidate mọi key liên quan branch. Không thêm helper hook mới trong wave 1.
3. **Version + If-Match**: mọi PATCH/PUT/POST-transition truyền `entity.version` mới nhất từ SWR cache; không lưu version riêng.
4. **Error UI**: hiển thị `ApiClientError.message` (đã bằng tiếng Việt do BE trả về), fallback "Không thực hiện được thao tác." nếu không phải `ApiClientError`.
5. **Vertical slice** theo module: mỗi phase = 1 module đi từ read còn thiếu → mutation đơn giản → mutation phức tạp. Đảm bảo sau mỗi phase có ít nhất một luồng end-to-end mới chạy được.
6. **Không sinh route mới trong wave 1** (promotions, nail-designs, campaigns, audit, reports, loyalty/system config, branches CRUD, accounts). Ghi vào deferred list trong spec.

## Dependency graph

```text
Phase 0 (foundation cleanup)
   │
   ├── Phase 1: Appointments lifecycle
   │       │
   │       └── Phase 5: Payment-quote (dùng appointment.version)
   │
   ├── Phase 2: Customers CRM
   │
   ├── Phase 3: Services + catalog
   │       │
   │       └── Phase 4: Staff depth (staff-skill dùng service list)
   │
   ├── Phase 6: Messages polish
   │
   └── Phase 7: Settings + Dashboard drill-down
```

Phase 1 ↔ 2 ↔ 3 ↔ 4 ↔ 6 độc lập, có thể parallel nếu chia agent. Phase 5 phụ thuộc Phase 1. Phase 7 phụ thuộc mọi phase trước cho read.

## Task list

### Phase 0 — Foundation cleanup

- [ ] **T0.1** — Xoá alias stale `reviews`/`useAdminReviews` (branch-less) trong `adminService` + `hooks.ts` vì BE không có endpoint đó; giữ `branchReviews`/`useAdminBranchReviews` cho wave 2.
- [ ] **T0.2** — Bổ sung helper `revalidateBranchScope(branchId)` trong `src/service/admin/index.ts` (thin wrapper `useSWRConfig().mutate(predicate)`) để mutation không lặp code.

### Checkpoint 0 — Foundation

- [ ] `pnpm lint`, `pnpm test`, `pnpm build` green.

### Phase 1 — Appointment lifecycle

- [ ] **T1.1** — Wire status-transition actions (check-in, service-start, service-completion, no-show) vào `AppointmentDetailPanel`. Nút hiển thị theo status; disable khi pending; hiển thị error inline.
- [ ] **T1.2** — Wire assignment change (đổi nhân viên) qua `useAdminAppointmentAllocationCandidates` + `adminService.assignAppointment`. Modal chọn nhân viên từ candidate list.
- [ ] **T1.3** — Wire actual-services (PUT) qua modal chỉnh dịch vụ thực tế và photos (POST) qua composer upload đơn giản (URL string, không quản lý storage).

### Checkpoint 1 — Appointment

- [ ] Login manager, click check-in → status BE chuyển `CONFIRMED → CHECKED_IN`, UI reflect.
- [ ] Đổi nhân viên → API 200, list appointment revalidate.
- [ ] Tắt BE giữa chừng → UI có error, không crash.

### Phase 2 — Customers CRM

- [ ] **T2.1** — Wire `useAdminCustomer` + `updateCustomer` (PATCH) vào `CustomerDetailPanel` (thay mock detail hiện tại).
- [ ] **T2.2** — Wire notes CRUD: `useAdminCustomerNotes`, `createCustomerNote`, `updateCustomerNote` trong tab "Ghi chú" của `CustomerDetailPanel`.
- [ ] **T2.3** — Wire loyalty ops: `useAdminCustomerBenefits`, `adjustCustomerPoints`, `issueCustomerCoupon`, `useAdminCustomerNailHistory`, `useAdminCustomerLookup` (dùng cho ô search customer trong page tạo appointment và payment).

### Checkpoint 2 — Customers

- [ ] Detail customer render từ API; edit thông tin → API 200.
- [ ] Cộng/trừ điểm → point balance cập nhật, ledger có bản ghi.

### Phase 3 — Services + catalog

- [ ] **T3.1** — Wire `updateService` (PATCH) vào modal edit trong `ServiceTable`; giữ `createService` đang có.
- [ ] **T3.2** — Wire service-categories CRUD (`useAdminServiceCategories` đã có; thêm create/update/reorder) vào `ServiceSidebar`.
- [ ] **T3.3** — Wire surcharges CRUD trong `AdminServices` tab mới "Phụ thu" (nếu chưa có UI, chỉ hiện danh sách + create/edit).

### Checkpoint 3 — Services

- [ ] Sửa 1 dịch vụ → thấy giá mới trong list ngay sau save.
- [ ] Thêm category → xuất hiện trong sidebar và filter bar.

### Phase 4 — Staff depth

- [ ] **T4.1** — Wire `updateStaff` + `setStaffCompensation` (PUT) trong `StaffDetailPanel` (giữ read compensation).
- [ ] **T4.2** — Wire `useStaffSkills` + `setStaffSkills` — thêm tab "Kỹ năng" với danh sách services BE trả, tick chọn.
- [ ] **T4.3** — Wire `useAdminStaffShifts` + `createStaffShift` + `createLeaveRequest` + `decideLeaveRequest` (chỉ dạng list tuần + modal đơn giản).
- [ ] **T4.4** — Wire `useAdminStaffPerformance` vào tab "Hiệu suất" trong detail panel.

### Checkpoint 4 — Staff

- [ ] Sửa hoa hồng nhân viên → BE ghi, hiển thị lại đúng.
- [ ] Tick 1 kỹ năng → PUT 200, appointment allocation candidate mới nhận nhân viên đó.

### Phase 5 — Payments extras

- [ ] **T5.1** — Wire `requestAppointmentPaymentQuote` trước bước "Xác nhận thanh toán" trong `AdminPayments`: gọi quote, hiện breakdown discount/tax từ BE, mới cho phép `recordAppointmentPayment` với quote id/version.

### Checkpoint 5 — Payments

- [ ] Quote → payment happy path chạy đủ, không dùng số tính local nữa cho các field BE cung cấp.

### Phase 6 — Messages polish

- [ ] **T6.1** — Wire `updateConversation` với dropdown "Đánh dấu đã đọc / Lưu trữ" trong `ConversationList`; unread badge decrement optimistic.

### Checkpoint 6 — Messages

- [ ] Mark read → `PATCH /conversations/{id}` 200, badge biến mất.

### Phase 7 — Settings + Dashboard drill-down

- [ ] **T7.1** — Wire `useAdminBranchSettings` + `updateBranchSettings` cho `AdminSettings` (form các trường đơn giản: booking window, cancellation policy, notification prefs — chỉ những field BE default trả).
- [ ] **T7.2** — Dashboard: mỗi upcoming appointment card link tới `/admin/appointments?id={id}` và detail panel auto-select.

### Checkpoint 7 — Full wiring

- [ ] `pnpm lint && pnpm test && pnpm build` green.
- [ ] Grep count: ≥ 85 method của `adminService` được component gọi (đo bằng script trong todo).
- [ ] Manual smoke: mỗi module trong 6 module hoàn thành ít nhất 1 mutation end-to-end với BE local.
- [ ] `docs/plans/admin-full-wiring-todo.md` toàn dấu `[x]` cho phần trong scope.

## Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| BE response shape lệch với FE types (đặc biệt các field `[field: string]: unknown` bypass) | Cao — mutation success nhưng UI hiển thị sai | Test happy path với BE local trước khi wire UI; log payload trong dev; nếu lệch thì ghi vào `docs/backend-api-gaps.md` v2 và giữ mock |
| RBAC: manager 1 chi nhánh bị 403 với action `catalog.write.all`, `branch.write.all` | Trung bình — nút vô nghĩa | Ẩn nút khi role không match; dùng `adminSession` permissions |
| Concurrent mutation trên cùng appointment (check-in trong khi khác đang reschedule) → 409 | Trung bình | UI show message "Dữ liệu vừa được cập nhật, tải lại" + auto revalidate |
| Message thread real-time (chưa có websocket) → gửi tin xong không thấy tin đối phương | Thấp | Chấp nhận, polling qua SWR revalidateOnFocus; ghi vào deferred |
| Wave 1 quá lớn cho 1 session | Cao | Mỗi phase là 1 commit checkpoint; có thể pause và resume qua todo file |

## Parallelization

- Có thể chia agent theo phase (1, 2, 3, 4, 6 độc lập).
- Phase 5 chờ Phase 1.
- Phase 7 chờ tất cả.
- Không parallel Phase 0 với các phase khác.

## Open questions

Xem `Open Questions` trong `docs/specs/SPEC-admin-full-wiring.md`. Không block wave 1 dưới giả định đã liệt kê.
