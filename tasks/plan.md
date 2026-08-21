# Kế hoạch map API Backend vào Frontend

## Mục tiêu

- Đồng bộ catalog FE với toàn bộ 164 operation trong registry chính thức của BE.
- Cung cấp API executor và SWR query dùng chung, có hỗ trợ path params, query, idempotency và optimistic concurrency.
- Map các domain đang có trên UI admin sang route BE tương ứng.
- Ghi rõ các nhu cầu UI chưa có API BE trong `docs/backend-api-gaps.md`.

## Phạm vi

1. Catalog API: public/customer/admin/media/provider/internal.
2. Client dùng được cho 159 API app-facing; 5 route webhook/internal chỉ lưu inventory và chặn gọi từ browser.
3. Domain admin hiện tại: dashboard, appointments, customers, payments, services, staff và messages.
4. Kiểm thử route resolution, header mutation và API coverage.

## Tiêu chí hoàn thành

- Catalog có đúng 164 operation, không trùng method + path.
- Mọi path parameter được encode và thiếu parameter phải báo lỗi.
- GET dùng được với SWR; mutation tự gắn `Idempotency-Key`, hỗ trợ `If-Match`.
- Có ma trận UI -> BE và danh sách gap đủ method/path/request/response mong đợi.
- `pnpm test`, `pnpm lint`, `pnpm build` đều đạt.
