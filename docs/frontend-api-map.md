# Bản đồ API Backend -> Frontend

Cập nhật: 2026-08-21

## Nguồn đối chiếu

- Registry chuẩn của BE: `apps/api/src/platform/operation-registry.ts` — 164 operation.
- Swagger runtime: `http://localhost:4000/docs-json` — phát hiện thêm 19 route controller tương thích.
- Tổng inventory runtime không trùng `method + path`: **183 operation**.
- App-facing: **174 operation**.
- Webhook/internal server-only: **9 operation**, FE chỉ lưu inventory và không cho browser gọi.

## Code FE

| File | Vai trò |
|---|---|
| `src/service/api/operations.ts` | Catalog 164 canonical + 19 legacy/compatibility. |
| `src/service/api/operation-client.ts` | Gọi mọi app-facing operation; resolve path/query/body, idempotency và version. |
| `src/service/api/operation-hooks.ts` | SWR hook chung cho GET operation. |
| `src/service/admin/` | Typed service/hook cho các khu admin hiện có. |

Ví dụ query:

```ts
const result = useApiOperation(
  "GET /api/v1/admin/branches/{branchId}/appointments",
  { path: { branchId }, query: { from, to, status: "CONFIRMED" } },
);
```

Ví dụ mutation:

```ts
await executeApiOperation(
  "PATCH /api/v1/admin/services/{serviceId}",
  {
    path: { serviceId },
    body: formValue,
    version: service.version,
    idempotencyKey: submitIntentId,
  },
);
```

## Map UI admin hiện tại

| Màn hình FE | API BE đã map | Trạng thái dữ liệu |
|---|---|---|
| `/admin` | `GET /admin/branches/{branchId}/dashboard`, `GET /admin/reports/revenue-summary`, `GET /admin/reports/staff-performance` | Route có, dashboard response chưa đủ field UI. |
| `/admin/appointments` | calendar, list/detail/create, assignment, reschedule, cancel, check-in, start, complete, no-show, actual-services, photos | Đủ command chính; list chưa lọc/phân trang và chưa có display snapshot. |
| `/admin/customers` | list/lookup/detail/create/update, notes, nail-history, benefits, points, coupon | Route đủ; list chưa hỗ trợ search/segment và thiếu customer summary. |
| `/admin/payments` | payment-quote, actual-services, capture payment, list payments, refund | Command đủ; thiếu checkout read-model và receipt/invoice contract. |
| `/admin/services` | services, categories, reorder, surcharges CRUD | Route đủ; list service chưa có category/filter/count bán. |
| `/admin/staff` | staff CRUD, skills, compensation, shifts, leave requests, staff-performance | Route đủ; thiếu aggregate read-model cho bảng doanh thu/hoa hồng hiện tại. |
| `/admin/messages` | Không có route tương ứng | Blocked bởi BE. |
| `/admin/settings` | branch, system-config, loyalty-config, compensation | Chỉ map được một phần; các nhóm cấu hình theo chi nhánh chưa có contract riêng. |

Chi tiết các phần thiếu hoặc response chưa đáp ứng UI nằm trong
`docs/backend-api-gaps.md`.
