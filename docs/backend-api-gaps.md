# Báo cáo API còn thiếu cho Backend

> Lưu ý: đây là snapshot phân tích ngày 2026-08-21, không phải nguồn inventory
> hiện hành. Bản đồ method/path mới nhất nằm tại `docs/frontend-api-map.md`.

Cập nhật: 2026-08-26 (bổ sung BE-GAP-011..013 từ đợt rà E2E; BE-GAP-001..010 vẫn là snapshot 2026-08-21)

Consumer: `yabai-nail-fe`

## Tóm tắt ưu tiên

| ID | Ưu tiên | Khu vực | Vấn đề |
|---|---|---|---|
| BE-GAP-001 | P0 | Tin nhắn | Chưa có API hội thoại và gửi tin. |
| BE-GAP-002 | P0 | Auth admin | Chưa có canonical session bootstrap an toàn chứa permissions/capabilities. |
| BE-GAP-003 | P1 | Dashboard | Response chưa đủ KPI/read-model mà UI hiển thị. |
| BE-GAP-004 | P1 | Lịch hẹn/thanh toán | List bỏ qua filter và thiếu snapshot hiển thị. |
| BE-GAP-005 | P1 | Khách hàng | List bỏ qua search/segment và thiếu summary. |
| BE-GAP-006 | P1 | Dịch vụ | List thiếu category/filter/sold count và pagination thật. |
| BE-GAP-007 | P1 | Thanh toán | Chưa có checkout read-model và hóa đơn/biên lai. |
| BE-GAP-008 | P1 | Nhân viên/hoa hồng | Chưa có aggregate branch compensation/performance cho bảng UI. |
| BE-GAP-009 | P2 | Cài đặt | Thiếu cấu hình theo chi nhánh cho booking/payment/automation/notification/backup. |
| BE-GAP-010 | P1 | API contract | Swagger không liệt kê đầy đủ registry chuẩn. |
| BE-GAP-011 | P1 | Mẫu nail | Không có endpoint tạo và liệt kê đề xuất mẫu nail. |
| BE-GAP-012 | P2 | Chi nhánh | `/branches` không trả số điện thoại chi nhánh. |
| BE-GAP-013 | P2 | Xoá dữ liệu | Không-xoá-cứng là thiết kế cố ý (RESTRICT + ẩn danh). Trống thật: admin không khởi tạo được luồng ẩn danh thay khách. |

## BE-GAP-001 — Hội thoại và gửi tin nhắn

UI `/admin/messages` cần danh sách hội thoại, thread, unread/archive và gửi tin. Registry 164 operation không có domain conversation/message.

Đề xuất tối thiểu:

| Method | Path | Request | Response mong đợi |
|---|---|---|---|
| `GET` | `/api/v1/admin/branches/{branchId}/conversations` | `q,status,cursor,limit` | `items[]` gồm conversation, customerSummary, lastMessage, unreadCount; `pageInfo`. |
| `GET` | `/api/v1/admin/branches/{branchId}/conversations/{conversationId}/messages` | `before,limit` | `items[]` gồm id,senderType,content,createdAt,deliveryStatus; `pageInfo`. |
| `POST` | `/api/v1/admin/branches/{branchId}/conversations/{conversationId}/messages` | body `content`; header `Idempotency-Key` | Message đã commit cùng delivery status. |
| `PATCH` | `/api/v1/admin/branches/{branchId}/conversations/{conversationId}` | body `status=READ/UNREAD/ARCHIVED`; `If-Match` | Conversation mới và `version`. |

Yêu cầu: branch scope, permission, rate limit, content length, audit, cursor ổn định và không trả dữ liệu hội thoại ngoài chi nhánh.

## BE-GAP-002 — Session bootstrap/capability cho admin

Login hiện trả `user` chỉ có role và `branchIds`; FE không biết permission/capability cụ thể để render action đúng. Canonical registry không có `GET` session/profile dành cho admin.

Swagger có route legacy `GET /api/v1/auth/session`, nhưng handler trả trực tiếp `UserAccountEntity`; contract này không nên dùng cho FE vì có nguy cơ lộ field nội bộ và không phải canonical operation.

Đề xuất:

```http
GET /api/v1/admin/auth/session
Authorization: Bearer <access-token>
```

Response mong đợi:

```json
{
  "user": {
    "id": "uuid",
    "displayName": "...",
    "phoneMasked": "09******02",
    "role": "MANAGER",
    "locale": "vi",
    "branchIds": ["uuid"],
    "permissions": ["appointment.read.assigned"],
    "capabilities": ["appointment.create", "payment.capture"]
  },
  "session": {
    "id": "uuid",
    "expiresAt": "ISO-8601",
    "activeBranchId": "uuid"
  }
}
```

Không trả password hash, refresh-token hash, token version nội bộ hoặc secret.

## BE-GAP-003 — Dashboard chi nhánh chưa đủ read-model

`GET /api/v1/admin/branches/{branchId}/dashboard` hiện chỉ trả appointment KPI, `upcoming` và `alerts`. UI cần thêm:

- doanh thu/ngày và so sánh kỳ trước;
- số khách, khách mới;
- nhân viên đang làm/nghỉ;
- breakdown phương thức thanh toán;
- chi phí, hoa hồng, phần tiệm nhận;
- upcoming appointment có `customerName`, service snapshots và `staffName` thay vì chỉ ID.

Đề xuất mở rộng chính endpoint hiện có, tránh FE gọi N+1. Response cần `generatedAt`, `dataFreshness`, currency `VND`, branch timezone và scope cá nhân khi actor là STAFF.

## BE-GAP-004 — List lịch hẹn bỏ qua filter và thiếu display snapshot

`GET /api/v1/admin/branches/{branchId}/appointments` hiện chỉ dùng `limit`; các query khác bị bỏ qua và `hasNextPage` luôn `false`.

Contract cần hỗ trợ:

```text
from, to, status[], staffId[], customerId, q, cursor, limit, sort
```

Mỗi item cần thêm read-only snapshot dùng cho list/calendar/checkout:

```json
{
  "customer": { "id": "...", "displayName": "...", "phoneMasked": "..." },
  "staff": { "id": "...", "displayName": "..." },
  "services": [{ "id": "...", "name": "...", "unitPriceVnd": 0, "durationMinutes": 0 }]
}
```

`pageInfo.endCursor/hasNextPage` phải phản ánh dữ liệu thật. Đây cũng là read-model đầu vào cho `/admin/payments`.

## BE-GAP-005 — List khách hàng chưa đáp ứng tìm kiếm/phân nhóm

`GET /api/v1/admin/branches/{branchId}/customers` hiện chỉ dùng `limit`; bỏ qua search/filter, không cursor và thiếu các summary UI cần.

Đề xuất query:

```text
q, segment, status, sort, cursor, limit
```

Item mong đợi: `displayName`, phone theo masking policy, birthday nếu được phép, `lastVisitAt`, `visitCount`, `totalSpendVnd`, `pointBalance`, membership tier/segment, preference summary và `version`.

Route `/customers/lookup` vẫn dùng cho lookup nhanh theo phone/q; không thay thế list có filter/pagination.

## BE-GAP-006 — Catalog service thiếu filter/category/statistics

`GET /api/v1/admin/services` hiện chỉ dùng `limit`, không dùng `q/categoryId/status/cursor`; `hasNextPage` luôn `false`. Entity service cũng chưa trả category mapping và sold count mà UI hiện hiển thị.

Đề xuất:

```http
GET /api/v1/admin/services?q=&categoryId=&status=&branchId=&cursor=&limit=
```

Item thêm `categoryId`, `categoryName`, `soldCount` theo khoảng thời gian tùy chọn; hoặc bỏ `soldCount` khỏi catalog và cung cấp report riêng nếu chi phí query cao.

## BE-GAP-007 — Checkout và hóa đơn/biên lai

Các command payment quote/capture/refund đã có. Phần đọc còn thiếu một read-model để mở màn hình checkout và contract biên lai sau thanh toán.

Đề xuất:

| Method | Path | Mục đích |
|---|---|---|
| `GET` | `/api/v1/admin/branches/{branchId}/appointments/{appointmentId}/checkout` | Customer/staff/service snapshots, actual services, discounts, quote eligibility, prior payments và version. |
| `GET` | `/api/v1/admin/branches/{branchId}/payments/{paymentId}/receipt` | Dữ liệu hóa đơn immutable sau commit. |
| `POST` | `/api/v1/admin/branches/{branchId}/payments/{paymentId}/receipt-deliveries` | Gửi email/SMS biên lai; idempotent, trả delivery status. |

Nếu không thêm `/checkout`, cần mở rộng appointment detail + payments để FE lấy đủ dữ liệu trong tối đa hai request và không N+1.

## BE-GAP-008 — Aggregate nhân viên và hoa hồng

Các route per-staff compensation và report staff-performance đã có, nhưng bảng UI cần một aggregate theo chi nhánh/kỳ gồm staff profile, trạng thái làm việc, revenue, order count, commission rate và commission amount. Ghép `staff + report + N compensation requests` gây N+1.

Đề xuất:

```http
GET /api/v1/admin/branches/{branchId}/staff-performance?period=YYYY-MM&cursor=&limit=
```

Response: KPI tổng + rows đã join + `pageInfo` + `generatedAt/dataFreshness`.

Lưu ý implementation hiện tại của `GET /admin/staff/{staffId}/compensation` đã merge query vào body trước khi handler nên `period` có thể chạy, nhưng contract cần test rõ trường hợp `period=YYYY-MM`.

## BE-GAP-009 — Cấu hình theo chi nhánh

UI settings có các nhóm salon, booking, payment, automation, notification và backup. Registry hiện có branch CRUD, global `system-config`, `loyalty-config` và compensation, nhưng chưa có contract branch-scoped rõ ràng cho:

- booking window, cancellation/reschedule policy, slot interval/buffer;
- payment methods và receipt settings;
- message templates/automation rules;
- notification preferences của chi nhánh;
- backup/export status và restore policy.

Đề xuất trước mắt một resource versioned:

```http
GET   /api/v1/admin/branches/{branchId}/settings
PATCH /api/v1/admin/branches/{branchId}/settings
```

Mutation bắt buộc `If-Match` + `Idempotency-Key`; field permission theo từng nhóm. Backup/restore nên là job resource riêng, không nhét vào config.

## BE-GAP-010 — Swagger/OpenAPI không đầy đủ

Runtime Swagger hiện chỉ mô tả các controller cụ thể và một catch-all `/{path}`. Vì vậy khoảng 164 canonical operation không có method/path/request/response schema riêng trong `/docs-json`; FE không thể generate typed client đáng tin cậy.

Yêu cầu BE:

- xuất đủ 164 canonical operations trong OpenAPI;
- đánh dấu 19 route compatibility là `deprecated: true` và chỉ ra route thay thế;
- schema đầy đủ cho envelope, request, response, error, enum;
- khai báo `Idempotency-Key`, `If-Match`, auth, query và status code trên từng operation;
- CI so sánh OpenAPI operation set với `operation-registry.ts` để chặn lệch contract.

## BE-GAP-011 — Đề xuất mẫu nail không có đường sinh ra

Phát hiện khi rà E2E ngày 2026-08-26. `POST /admin/nail-design-proposals/{id}/decision`
tồn tại, nhưng **không một dòng code nào trong backend tạo ra `NAIL_DESIGN_PROPOSAL`**:
không endpoint, không seed, không migration. Cũng không có endpoint liệt kê, nên màn
`/admin/nail-designs` phải bắt admin **gõ tay UUID đề xuất**.

Hệ quả: thao tác duyệt đề xuất không thể kiểm thử và trên thực tế không dùng được.

Đề xuất tối thiểu: endpoint cho khách/nhân viên gửi đề xuất, và `GET /admin/nail-design-proposals`
có phân trang + filter theo trạng thái.

Ghi chú: BE-GAP-001 (hội thoại) cùng dạng — `PATCH .../conversations/{id}` và
`POST .../conversations/{id}/messages` đều thao tác lên `CONVERSATION` mà không có
đường nào tạo ra nó.

## BE-GAP-012 — `/branches` thiếu số điện thoại

Payload trả về chỉ có `id`, `name`, `address`, `timezone`, `active`, `version`.
Bảng chi nhánh của admin có cột "Điện thoại" và luôn hiển thị `—`.

Đề xuất: thêm `phone` vào branch payload, hoặc bỏ cột nếu chi nhánh không có số riêng.

## BE-GAP-013 — Xoá dữ liệu: thiết kế cố ý, và một khoảng trống thật bên trong nó

**Không phải khoảng trống.** Lần ghi đầu của mục này gọi việc thiếu `DELETE` trên
`/admin/*` là thiếu sót. Đọc kỹ backend thì đây là quyết định kiến trúc, có ba bằng
chứng độc lập:

1. **16 khoá ngoại, toàn bộ `ON DELETE RESTRICT`**, không một `CASCADE` nào
   (`1723600002000-canonical-domains.ts`). Xoá cứng một khách hàng bất khả thi ở
   tầng CSDL vì `appointments`, `payments`, `point_transactions` đều tham chiếu tới.
2. **Xoá tài khoản là quy trình, không phải động từ**: `POST /me/account-deletion-requests`
   tạo bản ghi `ACCOUNT_DELETION` có `scheduledAt`, đẩy qua outbox
   (`account.deletion.scheduled`), rồi worker mới thực thi.
3. **Và nó ẩn danh chứ không xoá** (`provider.service.ts`, `executeAccountDeletion`):
   `phone → deleted<id>`, `displayName → "Deleted customer"`, `passwordHash → null`,
   ghi chú lịch hẹn và nội dung review bị xoá rỗng, **dòng user giữ nguyên**. Audit
   action là `ACCOUNT_ANONYMIZED`.

Nghĩa là sổ sách tài chính giữ nguyên vẹn, dữ liệu cá nhân bị gỡ. **Không nên thêm
`DELETE` cho CRUD admin**: hoặc va vào `RESTRICT`, hoặc phải nới `CASCADE` và thế là
xoá luôn lịch sử tiền. Danh mục (dịch vụ, phụ thu, mẫu nail, khuyến mãi) đã có cơ chế
đúng sẵn — tắt hiển thị / `ARCHIVED` / `INACTIVE`.

### Khoảng trống thật nằm ở chỗ khác

Luồng ẩn danh **chỉ có bản self-service** (`/me/...`). Không có route nào để admin
khởi tạo nó thay khách. Khi khách gọi điện yêu cầu xoá dữ liệu, hoặc khi cần xử lý
theo yêu cầu pháp lý, bảng quản trị không có đường nào làm.

Đề xuất: `POST /admin/branches/{branchId}/customers/{customerId}/deletion-requests`,
dùng lại đúng `ACCOUNT_DELETION` + outbox đã có, kèm ghi audit ai là người khởi tạo.

### Hệ quả cho việc dọn dữ liệu test

Dữ liệu test trên production **không gỡ được qua API** — chỉ ẩn được, và ẩn không gỡ
được số khỏi báo cáo vì báo cáo dựng từ bảng `payments`. Muốn sạch thật phải thao tác
thẳng vào DB, có backup trước. Cách phòng đúng là **không tạo dữ liệu test trên
production**, không phải mở thêm `DELETE`.

Ghi chú triển khai nếu sau này vẫn cần soft-delete cho danh mục: `handleRecord`
(`platform.controller.ts`, nhánh `method === "DELETE"`) đã có sẵn cơ chế theo
`kind` + `externalKey`, nhưng lọc `ownerId: principal.id` trong khi bản ghi do admin
tạo có `ownerId: null`.

## Những API không thiếu

Không cần BE tạo lại các domain sau vì registry đã có: auth login/refresh/logout, branch/catalog, appointment lifecycle, customer CRM/notes/history/loyalty, payment/refund, staff/skills/compensation/shifts/leave, reviews, promotions, nail designs, media, reports/export, notification campaign, audit và system/loyalty config.

Các route webhook/internal không được FE browser gọi trực tiếp.
