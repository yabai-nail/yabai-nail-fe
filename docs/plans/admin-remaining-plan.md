# Plan — Admin: bổ sung UI cho API BE chưa dùng

Spec: [SPEC-admin-remaining](../specs/SPEC-admin-remaining.md)

## Cách làm

Tuần tự 8 module, mỗi module: build → `data.test` → `typecheck/lint/test/build` → commit. Mỗi module 1 commit `feat(admin): <module>`. Dùng hook/service đã có, theo pattern `AdminServices`.

## Thứ tự & trạng thái

- [x] **M1 — Audit logs** (`/admin/audit-logs`): bảng read-only, filter theo action/actor, phân trang. Hook `useAdminAuditLogs`. ✅
- [x] **M2 — Reviews** (`/admin/reviews`): danh sách đánh giá theo chi nhánh, trả lời (`replyToBranchReview`), cập nhật xử lý (`updateBranchReviewHandling`). Hook `useAdminBranchReviews`/`useAdminReviews`. ✅
- [x] **M3 — Reports** (`/admin/reports`): KPI doanh thu + bảng branches/customers/staff; nút tạo export. Hook `useRevenueReport`, `useAdminBranchesReport`, … ✅
- [x] **M4 — Marketing** (`/admin/marketing`): tab Khuyến mãi (CRUD + phát hành) + tab Chiến dịch (tạo + preview audience). ✅
- [x] **M5 — Nail Designs** (`/admin/nail-designs`): danh sách + tạo/sửa + duyệt đề xuất (theo id — BE chưa có list proposal). ✅
- [x] **M6 — Accounts & Config** (`/admin/accounts`): tài khoản CRUD + reset mật khẩu + system/loyalty config. ✅
- [x] **M7 — Branches** (`/admin/branches`): chi nhánh CRUD. ✅
- [x] **M8 — Operations** (`/admin/operations`): refund, duyệt nghỉ phép, check-in/membership resolution, tra cứu khách — gom vào trang mới (additive, không sửa màn hình đang chạy). ✅

### Còn lại (op read/reorder nằm trong màn hình đang chạy — để tránh regression, làm sau)
Các op thuần đọc theo id hoặc reorder cần chèn vào component đã wired: `GET .../calendar`, `GET .../customers/{id}`, `GET .../appointments/{id}/payments`, `GET .../payments/{id}/refunds/{id}`, `POST /admin/service-categories/reorder`. Nên làm trong đợt tinh chỉnh từng màn để không phá UI hiện có.

## Verification record

| Module | typecheck | lint | test | build | commit |
|---|---|---|---|---|---|
| M1 | ✅ 0 lỗi | ✅ | ✅ 6/6 | ⚠️ offline-fonts | `9d87b70` |
| M2 | ✅ 0 lỗi | ✅ | ✅ 6/6 | ⚠️ offline-fonts | `56812d1` |
| M3 | ✅ 0 lỗi | ✅ | ✅ 5/5 | ⚠️ offline-fonts | `2f312be` |
| M4 | ✅ 0 lỗi | ✅ | ✅ 5/5 | ⚠️ offline-fonts | `_M4_` |
| M5 | ✅ 0 lỗi | ✅ | ✅ 4/4 | ⚠️ offline-fonts | `_M5_` |
| M6 | ✅ 0 lỗi | ✅ | ✅ 4/4 | ⚠️ offline-fonts | `_M6_` |
| M7 | ✅ 0 lỗi | ✅ | ✅ 3/3 | ⚠️ offline-fonts | `_M7_` |
| M8 | ✅ 0 lỗi | ✅ | ✅ 4/4 | ⚠️ offline-fonts | `_M8_` |

Full suite sau M8: **130/130 test pass, lint sạch, không regression.**
