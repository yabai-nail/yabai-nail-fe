# Spec: Admin Full API Wiring

## Trạng thái

- Capability id: `admin-full-wiring`
- Trạng thái: Đang triển khai — spec khởi tạo ngày 2026-08-23
- URL surface: mọi route dưới `/admin/*` đã tồn tại
- Phụ thuộc: `admin-foundation`, `admin-appointments`, `admin-customers`, `admin-services`, `admin-staff`, `admin-payments`, `admin-messages`, `admin-settings`, `admin-dashboard`, `fe-be-api-map`
- Nguồn đối chiếu: `src/service/admin/service.ts` (101 method typed), `src/service/api/operations.ts` (191 operation), backend `packages/api` snapshot khớp qua `docs/frontend-api-map.md`

## Bối cảnh

Toàn bộ 191 operation của BE đã có typed method trong `adminService`/`authService`/`bookingService`. Nhưng chỉ 17/101 admin method thực sự được component UI gọi (8 hook + 8 mutation trực tiếp + 1 alias). Nói cách khác **contract đã đủ, wiring UI mới ~1/6**.

Spec này định nghĩa việc **wire nốt 5/6 còn lại** để 6/6 module admin có full read + write path chạy API thật, thay các đường write đang còn mock/local-state.

## Giả định đã surface — cần confirm hoặc override

1. **Scope là wiring, không design lại UI.** Component đã có layout/state hiện tại; chỉ thay data source từ mock sang API và bổ sung mutation call. Không thêm màn hình mới, không đổi navigation.
2. **Ưu tiên write path đã có UI control hiển thị.** Ví dụ nút "Check-in" đang không làm gì → wire. Report/Audit không có route trong AdminShell nav → **out of scope wave 1**, để wave 2.
3. **Không tự tạo trang mới cho các domain chưa có route** (promotions, nail-designs, notification-campaigns, loyalty-config, system-config, audit-logs, report-exports, branch settings write). Spec ghi rõ nhóm này ở `Deferred` phía dưới.
4. **Mock fallback giữ lại** khi API trả 401/403/500 để dev không mất context; nhưng UI phải hiển thị lỗi bằng `ApiClientError.code` (không leak stack) và có nút retry.
5. **Optimistic update** cho các mutation nhanh (mark read, cancel, no-show); các mutation liên quan tiền (payment/refund) chỉ update sau khi API trả success.
6. **Idempotency-Key** để `executeApiOperation` tự sinh (đã default). `If-Match` truyền `entity.version` khi BE trả về `version`.
7. **Auth**: Vẫn dùng token in-memory hiện có. Không đụng persistence session, không thêm refresh-token loop trong scope này.
8. **i18n**: Tất cả error message dùng string cứng tiếng Việt như code hiện tại; không tách message catalog mới.
9. **Testing**: Mỗi service method mới đi kèm unit test qua `apiRequest` mock (theo pattern `service.test.ts` hiện có). UI wiring có smoke test render + error state; không viết e2e mới.
10. **Không đụng backend**. Nếu phát hiện contract lệch, ghi vào `docs/backend-api-gaps.md` v2 và giữ mock chỗ đó, không patch API contract từ FE.

## Objective

Đưa tỉ lệ wiring admin từ **17/101 method (~17%)** lên **≥ 85% method có UI trigger hoặc read consumer**. Sáu module admin đều phải có:

- **Read path** chạy API thật với loading/error/empty state.
- **Ít nhất một mutation write path** end-to-end (API success → SWR revalidate → UI reflect).
- **Error handling** hiển thị `ApiClientError.message`, không crash trang.

## Sáu module trong scope

| # | Module | Route | Trạng thái wiring hiện tại | Mục tiêu |
|---|---|---|---|---|
| 1 | Appointments | `/admin/appointments` | list + detail + create/reschedule/cancel | + check-in, service-start, service-completion, no-show, assignment, actual-services, allocation-candidates, photos, payment-quote |
| 2 | Customers | `/admin/customers` | list + create | + detail, update, notes CRUD, points adjustment, coupon issuance, nail-history, benefits, lookup |
| 3 | Services | `/admin/services` | list + create | + update, service-categories CRUD + reorder, surcharges CRUD |
| 4 | Staff | `/admin/staff` | list + create + compensation read | + update, staff-compensation write, staff-skills read/write, staff-shifts read/create, leave-requests create/decide, staff-performance |
| 5 | Payments | `/admin/payments` | checkout + record payment | + payment-quote, refund, refund detail |
| 6 | Messages | `/admin/messages` | list conversations + thread + send | + conversation update (mark read/archive) |

Ngoài 6 module core, spec đóng thêm phần **Settings write** (`/admin/settings`) và **Dashboard drill-down** vì đã có UI hiển thị nhưng không có write.

## Deferred (wave 2, không trong spec này)

- Route mới cho: promotions, nail-designs, notification-campaigns, audit-logs, report-exports, loyalty-config, system-config, branches CRUD, accounts CRUD, reviews moderation.
- Route mới cho các báo cáo: revenue-report, branches-report, customers-report, staff-performance-report.
- Payment refund UI (chỉ wire service method, chưa có màn hình refund).

Các hàm `adminService.*` cho nhóm trên đã tồn tại — giữ nguyên, không xoá; chỉ chưa có consumer UI trong wave 1.

## Commands

```bash
# Dev
pnpm dev

# Verify
pnpm lint
pnpm test
pnpm build
```

BE cần chạy song song ở `http://localhost:4000/api/v1`:

```bash
# In yabai-nail-platform
pnpm dev:docker
```

Demo accounts (OTP `123456`, admin password fixture theo BE seed):
- `0900000002` — manager một chi nhánh
- `0900000003` — owner toàn chuỗi

## Project Structure

Không thêm cấu trúc mới. Wiring nằm đúng chỗ đang có:

```
src/
  service/
    admin/
      service.ts    → thêm test cho method chưa test
      hooks.ts      → thêm hook nếu component cần SWR read
    api/            → không đụng
  components/
    pages/admin/
      Admin<Module>/
        component.tsx           → wire fetch/mutation
        <Feature>Modal.tsx      → wire mutation
        <Feature>Panel.tsx      → wire read
```

Test file luôn cùng thư mục với target theo pattern `*.test.ts(x)` (Vitest).

## Code Style

Theo đúng pattern hiện có. Ví dụ wire một mutation:

```tsx
// src/components/pages/admin/AdminAppointments/component.tsx
"use client";

import { useState } from "react";
import { useSWRConfig } from "swr";
import { adminService, useAdminAppointment } from "@/service";

export function CheckInButton({ branchId, appointmentId }: Props) {
  const { data: appointment } = useAdminAppointment(branchId, appointmentId);
  const { mutate } = useSWRConfig();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onCheckIn() {
    if (!appointment) return;
    setPending(true);
    setError(null);
    try {
      await adminService.checkInAppointment(branchId, appointmentId, appointment.version);
      // Revalidate everything that keys on this branch's appointments.
      await mutate(
        (key) => typeof key === "string" && key.includes(`/branches/${branchId}/appointments`),
      );
    } catch (thrown) {
      setError(thrown instanceof Error ? thrown.message : "Không thể check-in.");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <Button onPress={onCheckIn} isDisabled={pending || appointment?.status !== "CONFIRMED"}>
      {pending ? "Đang xử lý…" : "Check-in"}
      </Button>
      {error ? <p role="alert" className="text-danger text-sm">{error}</p> : null}
    </>
  );
}
```

Quy ước cứng:

- Mutation luôn `try/catch`, không để `unhandledrejection`.
- Sau mutation success: `mutate(key)` bằng predicate function (chọn tất cả key SWR liên quan), không hard-code key string.
- `version` cho `If-Match` luôn lấy từ entity vừa fetch, không cache riêng.
- Không thêm try/catch ở tầng service — service throw `ApiClientError`, UI catch.

## Testing Strategy

- **Unit (service.ts)**: mỗi method mới có 1 test happy path + 1 test error mapping (đã có harness trong `service.test.ts`).
- **Unit (hooks.ts)**: chỉ khi có logic conditional key/enabled; không test wrapper thuần.
- **Component smoke**: cho mỗi wave module, 1 test render "success state" + 1 test render "error state" bằng `swr` fallback data.
- **Không viết e2e mới** trong scope này. Kiểm chứng chạy thủ công qua BE local.

Coverage target: service.ts đạt 100% branch cho method có `body` hoặc `version`; component 60% line (không ép 100% vì nhiều branch chỉ về CSS state).

## Boundaries

- **Always**:
  - Chạy `pnpm lint && pnpm test && pnpm build` trước mỗi commit wave.
  - Cập nhật `docs/plans/admin-full-wiring-todo.md` khi hoàn thành task.
  - Wire theo thứ tự read → mutation → error state, không skip step giữa chừng.
  - `Idempotency-Key` để executor tự sinh; `If-Match` truyền version thật.
- **Ask first**:
  - Đổi shape của một `adminService.*` method đã tồn tại (breaks caller khác).
  - Thêm dependency mới vào `package.json`.
  - Đổi contract của SWR fetcher hoặc token slot.
  - Nếu phát hiện field BE trả khác type declared trong `types.ts` — ghi backend-api-gap trước.
- **Never**:
  - Đụng file trong `yabai-nail-platform/`.
  - Bypass `apiRequest`/`executeApiOperation` và gọi thẳng `axios`.
  - Đưa access token vào `localStorage`/cookie từ FE.
  - Comment-out hoặc `--no-verify` khi hook fail; sửa root cause.
  - Xoá mock `data.ts` khi chưa xác nhận API endpoint chạy.

## Success Criteria

- [ ] `pnpm build` green trên `feat/admin-full-wiring`.
- [ ] `pnpm test` xanh, thêm ít nhất 15 test mới cho service methods trước đây không test.
- [ ] `adminService` có ≥ 85 method được component nào đó gọi (đo bằng grep + list trong todo).
- [ ] Mỗi module trong 6 module core hiển thị được read data thật từ BE local khi login manager `0900000002`.
- [ ] Mỗi module có ≥ 1 mutation end-to-end verified qua browser + BE log.
- [ ] Error path: tắt BE giữa chừng → UI hiện message tiếng Việt, không crash, có nút retry hoặc SWR tự retry.
- [ ] Todo list được cập nhật đầy đủ; mỗi task đóng có dòng verify.

## Open Questions

1. Payment refund có UI panel dành riêng chưa, hay wave 2 mới thêm màn? (Assumption: wave 2.)
2. Update conversation status có UI toggle read/archive trong danh sách chưa, hay thêm dropdown mới trong wave 1? (Assumption: thêm dropdown nhỏ inline trong wave 1.)
3. Staff shifts hiển thị dạng calendar hay list? Hiện tại `/admin/staff` chỉ có detail — assumption: thêm tab "Ca làm" trong StaffDetailPanel dưới dạng list nhóm theo tuần.
4. Nếu BE trả `403 FORBIDDEN` cho action assignment/decide-leave-request khi login là `MANAGER` một chi nhánh → tôn trọng, ẩn/disable nút với tooltip. Assumption đúng?

Trả lời sau; giả định trên đủ để bắt đầu wave 1.
