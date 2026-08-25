# SPEC — Admin: wire 18 admin op còn thiếu UI

Cập nhật: 2026-08-25

## Bối cảnh

Sau đợt `admin-remaining` (52→88 op admin gọi ở UI), còn **18 admin operation** đã bọc service/hook nhưng chưa màn hình nào dùng. Hook/service **gần như đã sẵn** (chỉ thiếu `useAdminStaffMember`). Spec này wire nốt, chủ yếu **additive** vào màn hình đang chạy để tránh regression.

## Phạm vi & phân nhóm (18 op)

### A. Admin-auth (5) — feature thật (authService + useAdminSession)
| Op | UI |
|---|---|
| `GET /admin/auth/session` | Session bootstrap: hiện user/role trên shell header (hook `useAdminSession`) |
| `POST /admin/auth/sessions/{id}/branch` | Đổi chi nhánh qua API khi chọn ở BranchSelector (dùng sessionId từ bootstrap) |
| `POST /admin/auth/password-changes` | Form "Đổi mật khẩu" trong Settings |
| `POST /admin/auth/password-reset-requests` | Bước 1 quên mật khẩu (trong LoginModal admin) |
| `POST /admin/auth/password-resets` | Bước 2 đặt lại mật khẩu |

### B. Detail drawer/read trong màn hình đang chạy (9)
| Op | Màn | Hook |
|---|---|---|
| `GET /admin/audit-logs/{logId}` | Audit → click dòng | `useAdminAuditLog` |
| `GET /admin/branches/{id}` | Branches → xem chi tiết | `useAdminBranchDetail` |
| `GET .../customers/{id}` | Customers → chi tiết | `useAdminCustomer` |
| `GET /admin/staff/{staffId}` | Staff → chi tiết | **thêm `useAdminStaffMember`** |
| `GET .../appointments/{id}/payments` | Payments → lịch sử thanh toán | `useAdminAppointmentPayments` |
| `GET .../payments/{id}/refunds/{id}` | Payments → chi tiết hoàn tiền | `useAdminPaymentRefund` |
| `GET /admin/report-exports/{id}` | Reports → trạng thái export | `useAdminReportExport` |
| `GET /admin/reviews` | Reviews → tab "Toàn hệ thống" | `useAdminReviews` |
| `GET .../calendar` | Appointments → view lịch gọn | `useAdminCalendar` |

### C. Campaign theo id (3) — BE không có list chiến dịch → nhập id tay
`GET notification-campaigns/{id}/metrics`, `POST .../{id}/cancellation`, `POST notification-campaigns/audience-previews` — panel trong tab Chiến dịch (Marketing).

### D. Reorder (1)
`POST /admin/service-categories/reorder` — nút lên/xuống trong quản lý danh mục (Services).

## Tiêu chí nghiệm thu (chung)
- Additive: không đổi luồng/behavior hiện có; chỉ thêm modal/tab/nút/panel.
- Mutation kèm `Idempotency-Key`/`If-Match` do service tự lo; revalidate bằng `mutate()`.
- Logic thuần (nếu có) ở `data.ts` + `data.test.ts`.
- `tsc --noEmit` 0 lỗi mới · `vitest` full pass · `eslint` sạch · **không regression**.
- Commit theo nhóm A/B/C/D.

## Assumptions / rủi ro đã nêu
- **A (auth)** rủi ro nhất (chạm auth context/BranchSelector) → làm cẩn thận, additive, giữ login hiện tại.
- **C** không có UX tốt hơn nếu BE chưa có list chiến dịch → nhập campaignId tay (nhất quán với panel proposal ở M5).
- Không sửa backend.

## Ngoài phạm vi
- Không đụng mobile. Không thêm op ngoài 18. Không refactor không liên quan.
