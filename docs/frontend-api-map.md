# Bản đồ API Backend → Frontend

Cập nhật: 2026-08-22

## Phạm vi

Tài liệu này ghi nhận parity 1:1 giữa runtime API của
`yabai-nail-platform` và operation catalog trong `yabai-nail-fe`. Đây là map
contract; không có nghĩa mọi operation đã được component UI fetch.

Backend chỉ được đọc để đối chiếu. Thay đổi mapping nằm hoàn toàn trong FE.

## Nguồn đối chiếu và kết quả

| Nhóm | Nguồn BE | Export FE | Số lượng | Trạng thái |
|---|---|---|---:|---|
| Canonical | `CANONICAL_OPERATIONS` | `apiOperations` | 164 | Khớp 1:1 |
| Accepted feature | `FEATURE_OPERATIONS` | `featureApiOperations` | 8 | Khớp 1:1 |
| Controller compatibility | Runtime Swagger/controllers | `compatibilityApiOperations` | 19 | Khớp 1:1 |
| Tổng runtime | Ba nhóm trên | `runtimeApiOperations` | 191 | Unique `method + path` |
| Browser-facing | Audience `app` | Generic executor | 182 | Cho phép resolve/call |
| Server-only | Audience `provider/internal` | Inventory only | 9 | Browser bị chặn |

Source map đầy đủ nằm tại `src/service/api/operations.ts`; mỗi dòng trong ba
source list tương ứng đúng một backend `METHOD /path`.

## 8 accepted feature operations

```http
GET   /api/v1/admin/auth/session
GET   /api/v1/admin/branches/{branchId}/conversations
GET   /api/v1/admin/branches/{branchId}/conversations/{conversationId}/messages
POST  /api/v1/admin/branches/{branchId}/conversations/{conversationId}/messages
PATCH /api/v1/admin/branches/{branchId}/conversations/{conversationId}
GET   /api/v1/admin/branches/{branchId}/staff-performance
GET   /api/v1/admin/branches/{branchId}/settings
PATCH /api/v1/admin/branches/{branchId}/settings
```

Đây là tám operation trước đây có ở BE nhưng thiếu trong FE catalog.

## Ranh giới thực thi

- `getApiOperation(id)` resolve toàn bộ 191 operation.
- `buildOperationPath()` chỉ tạo browser path cho 182 operation audience `app`.
- 9 webhook/internal operation được giữ để kiểm tra coverage nhưng luôn bị từ
  chối khi browser client cố gọi.
- Mutation tiếp tục dùng `Idempotency-Key`; `If-Match` được truyền khi caller
  cung cấp version.

## Ngoài phạm vi

- Không chỉnh source backend.
- Không thêm DTO suy đoán.
- Không thêm wrapper/hook cho từng operation.
- Không thay mock/local state hoặc nối API vào component UI.

Mức độ UI thực sự fetch API là một báo cáo khác với contract parity và không
được dùng để thay đổi con số 191 của runtime operation map.
