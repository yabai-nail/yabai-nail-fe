# Plan: Admin Payments

## Trạng thái

- Spec: `docs/specs/SPEC-admin-payments.md` — đã duyệt ngày 2026-08-16.
- Task target: `docs/plans/admin-payments-todo.md`.
- Capability id: `admin-payments`.
- Implementation: Chưa bắt đầu; được phép bắt đầu từ `AP-01`.

## Mục tiêu

Triển khai `/admin/payments` thành một checkout prototype hoàn chỉnh trên admin foundation: appointment/customer context, cấu thành dịch vụ, calculation/discount, phương thức thanh toán, chia doanh thu, xác nhận paid và invoice preview. Mỗi lát cắt phải giữ source ở trạng thái build/test được và không tạo giao dịch thật.

## Dependency graph

```text
admin-foundation
└── payment contracts + pure calculation/state
    ├── route + sidebar metadata
    ├── customer/appointment context
    └── service composition
         └── totals + discount + revenue split
              └── method + confirmation + paid lock
                   └── invoice preview + print
                        └── dashboard integration + responsive review
```

Build order:

`domain-tests → route-context → service-composition → totals-split → confirmation-paid → invoice-print → integration-review`

## Architecture decisions

1. **Payment domain tự sở hữu snapshot.** Không import fixture từ `AdminAppointments`, `AdminCustomers` hoặc `AdminServices`; chỉ dùng contract payment typed để tránh page-to-page coupling.
2. **Integer money.** Giá, giảm giá và totals là integer VND; UI chỉ format bằng `formatVnd`.
3. **Một invoice source.** Connected component sở hữu `CheckoutInvoice`; ba panel chỉ nhận props và callback.
4. **Pure calculations trước UI.** Totals, split, validation và immutable transitions nằm trong `payment-state.ts`, được khóa bằng Vitest.
5. **Paid là state boundary.** Mọi helper thay đổi tiền phải trả nguyên invoice hoặc validation error khi status là `paid`.
6. **HeroUI cho interaction.** Modal cho service/line item/preview; AlertDialog cho cancel và confirm payment; radio group cho phương thức.
7. **Không thêm payment SDK.** Capability này không gọi backend/gateway và không xử lý credential.
8. **Route bật cùng page.** Chỉ đổi `payments.isAvailable` sang `true` sau khi route render thành công.
9. **Print là explicit user action.** Preview render trước; `window.print()` chỉ gọi từ nút trong preview, không chạy khi mở trang.

## Vertical slices

### Slice 1 — Domain model and calculation tests

- Tạo contracts, fixtures và trạng thái invoice draft.
- Viết RED tests cho subtotal, discount, split, line-item transitions và paid lock.
- Implement pure helpers đến khi focused tests xanh.

Checkpoint: domain không phụ thuộc React/browser và tất cả currency invariants được chứng minh bằng test.

### Slice 2 — Route and appointment context

- Tạo route/page index/connected component skeleton.
- Bật sidebar metadata sau khi page tồn tại.
- Dựng customer/appointment panel và local overlays đổi nhân viên/ngày giờ/hủy.

Checkpoint: `/admin/payments` trả `200`, sidebar active, context actions không reload và không thay đổi totals ngoài ý muốn.

### Slice 3 — Service composition

- Dựng booked/current service comparison và service selection Modal.
- Dựng additional-item list cùng add/edit/delete/custom flow.
- Nối duplicate/required/price validation từ pure helpers.

Checkpoint: service composition cập nhật immutable invoice và không có action inert.

### Slice 4 — Totals, discount and revenue split

- Dựng summary dùng selector duy nhất.
- Nối discount validation và commission percentage editor.
- Hiển thị customer total, staff share và salon share nhất quán ở main/right panel.

Checkpoint: mọi tổng trong DOM khớp cùng calculation result và split luôn cộng lại đúng grand total.

### Slice 5 — Payment confirmation and invoice

- Dựng payment method picker bằng HeroUI radio semantics.
- Dựng confirmation AlertDialog và state transition `draft → paid`.
- Khóa money mutation sau paid; dựng order note, invoice preview và print trigger.

Checkpoint: confirm/paid lock/focus/preview hoạt động bằng keyboard; không thu thập thông tin thanh toán thật.

### Slice 6 — Integration and final review

- Nối dashboard quick action và sidebar SPA navigation.
- Polish responsive 320/768/1024/1440 và print styles trong phạm vi spec.
- Chạy full tests/type/lint/build/browser QA và review năm trục.
- Cập nhật spec/task verification record sau khi thực sự đạt.

## Verification matrix

```powershell
pnpm test
pnpm exec next typegen
pnpm exec tsc --noEmit
pnpm run lint
pnpm run build
```

- Route: `/admin/payments` trả `200`; các route admin/client hiện có tiếp tục build.
- Unit: money calculations, discount boundaries, split rounding, immutable line items và paid lock.
- Interaction: service swap, add/edit/delete/custom, discount, commission, method, confirm, cancel, note và preview.
- Accessibility: heading hierarchy, radio group, error linkage, overlay focus/Escape và accessible action names.
- Responsive: 320×800, 768×1024, 1024×768, 1440×900; không page-level overflow.
- Security boundary: không network payment request, credential field, sensitive log hoặc persistence.
- Review: không có Critical/Required finding trước khi đánh dấu hoàn thành.

## Checkpoints and commit strategy

1. `feat: add tested payment domain logic`
2. `feat: add admin payment route and appointment context`
3. `feat: add checkout service composition`
4. `feat: add payment totals and revenue split`
5. `feat: add local payment confirmation and invoice preview`
6. `feat: connect admin payment entry points`
7. `fix: polish payment accessibility and responsive layout`
8. `docs: record verified payment delivery`

Mỗi commit chỉ tạo sau focused tests và TypeScript; full lint/build/browser chạy tại checkpoint cuối.

## Risks and mitigation

| Risk | Impact | Mitigation |
|---|---|---|
| Tổng tiền lệch giữa các panel | Cao | Một selector `calculatePaymentTotals`; presentation không tự cộng tiền |
| Rounding làm staff + salon lệch total | Cao | Tính staff trước, salon là phần còn lại; test số tiền lẻ |
| UI prototype bị hiểu là thanh toán thật | Cao | Không payment SDK/API/credential; copy trạng thái rõ là local fixture |
| Invoice paid vẫn sửa được | Cao | Guard trong pure mutation helpers và disable UI; test cả hai lớp |
| Scope phình sang appointment/service CRUD | Trung bình | Chỉ snapshot/local overlay; API hoặc shared domain phải hỏi trước |
| Bảng line item tràn mobile | Trung bình | Card rows hoặc internal scroll; browser-check bốn viewport |
| `window.print()` khó test | Trung bình | Tách invoice preview khỏi print trigger; browser chỉ xác nhận explicit action |

## Parallelization

- Không cần sub-agent cho capability này vì invoice state liên kết chặt giữa composition, totals và confirmation.
- Sau khi contract domain ổn định, customer context và service presentation có thể làm song song nếu người dùng yêu cầu explicit agents.
- Totals và confirmation phải tuần tự sau domain helpers; route config chỉ bật sau khi page tồn tại.

## Completion gate

- Người dùng đã duyệt spec và plan.
- Mọi task checklist có bằng chứng test/runtime/browser thật.
- Không có hard-coded derived total, duplicate state source hoặc paid mutation.
- Không thêm dependency, backend call hoặc dữ liệu thanh toán thật.
- Spec, plan, task list và docs index phản ánh đúng trạng thái triển khai.

## Open questions

- Không còn câu hỏi chặn implementation.
