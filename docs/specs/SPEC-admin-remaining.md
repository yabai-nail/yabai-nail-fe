# SPEC — Admin: bổ sung UI cho API BE chưa dùng

Cập nhật: 2026-08-24

## Bối cảnh

Đối chiếu `adminService` (`src/service/admin`) với UI cho thấy **101 admin operation đã bọc, 52 được UI gọi, 49 chưa có màn hình dùng**. Toàn bộ 49 operation **đã có sẵn service method + hook** — phần thiếu **chỉ là UI**. Spec này bổ sung UI cho 49 operation đó, gom thành 8 module, mỗi module theo đúng pattern `AdminX` hiện có (route mỏng → `component.tsx` "use client" dùng hook `useAdminXxx` → `data.ts` thuần + `data.test.ts` → `AdminPageLayout`).

Không sửa backend, không thêm service/hook mới trừ khi thiếu. Nếu server trả rỗng → hiển thị fixture như các trang hiện tại.

## Phạm vi (8 module)

| # | Module | Route | Operation chính | Kiểu |
|---|---|---|---|---|
| 1 | Nhật ký hệ thống (Audit) | `/admin/audit-logs` | `GET /admin/audit-logs`, `/{logId}` | read-only |
| 2 | Đánh giá (Reviews) | `/admin/reviews` | `GET /admin/branches/{}/reviews`, `PATCH .../handling`, `POST .../replies`, `GET /admin/reviews` | list + action |
| 3 | Báo cáo (Reports) | `/admin/reports` | `GET /admin/reports/revenue-summary|branches|customers|staff-performance`, `POST /admin/report-exports` (+ `{id}`, `/download-url`) | read + export |
| 4 | Marketing | `/admin/marketing` | promotions CRUD + issuances; notification-campaigns create/cancel/metrics + audience-previews; `POST /admin/audiences/previews` | list + CRUD |
| 5 | Mẫu nail (Nail Designs) | `/admin/nail-designs` | `GET/POST/PATCH /admin/nail-designs`, `POST /admin/nail-design-proposals/{}/decision` | list + CRUD |
| 6 | Tài khoản & Cấu hình | `/admin/accounts` | accounts CRUD + password-resets; system-config get/patch; loyalty-config get/put | list + form |
| 7 | Chi nhánh (Branches) | `/admin/branches` | `GET/POST /admin/branches`, `GET/PATCH /admin/branches/{}` | list + CRUD |
| 8 | Gap lẻ | (trong module sẵn có) | refund payment; customer detail/lookup; calendar; leave decision; reorder categories | bổ sung |

## Tiêu chí nghiệm thu (chung mỗi module)

- Có route `src/app/(admin)/admin/<name>/page.tsx` (metadata + render component), đăng ký trong `AdminShell/config.ts` (`isAvailable: true`).
- `component.tsx` dùng hook `useAdminXxx` thật; loading/error rõ ràng; fallback fixture khi rỗng.
- Logic thuần (filter/paginate/format) nằm ở `data.ts`, có `data.test.ts` (vitest) xanh.
- Mutation (nếu có) gọi `adminService.*`, kèm `Idempotency-Key`/`If-Match` do service tự lo; revalidate bằng `mutate()`.
- `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build` xanh.
- Mỗi module 1 commit độc lập.

## Ngoài phạm vi

- Không sửa backend/service/hook (trừ khi thiếu hook cho 1 op — khi đó thêm hook tối thiểu).
- Không làm module Messages chat mở rộng (BE chưa đủ), không đụng luồng khách hàng (site).
- Schema payload chi tiết của BE vẫn generic — UI dựa trên type FE hiện có trong `admin/types.ts`.
