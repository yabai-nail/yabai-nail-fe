# Plan — Admin: bổ sung UI cho API BE chưa dùng

Spec: [SPEC-admin-remaining](../specs/SPEC-admin-remaining.md)

## Cách làm

Tuần tự 8 module, mỗi module: build → `data.test` → `typecheck/lint/test/build` → commit. Mỗi module 1 commit `feat(admin): <module>`. Dùng hook/service đã có, theo pattern `AdminServices`.

## Thứ tự & trạng thái

- [ ] **M1 — Audit logs** (`/admin/audit-logs`): bảng read-only, filter theo action/actor, phân trang. Hook `useAdminAuditLogs`.
- [ ] **M2 — Reviews** (`/admin/reviews`): danh sách đánh giá theo chi nhánh, trả lời (`replyToBranchReview`), cập nhật xử lý (`updateBranchReviewHandling`). Hook `useAdminBranchReviews`/`useAdminReviews`.
- [ ] **M3 — Reports** (`/admin/reports`): KPI doanh thu + bảng branches/customers/staff; nút tạo export. Hook `useRevenueReport`, `useAdminBranchesReport`, …
- [ ] **M4 — Marketing** (`/admin/marketing`): tab Khuyến mãi (CRUD + phát hành) + tab Chiến dịch (tạo/huỷ/metrics + preview audience).
- [ ] **M5 — Nail Designs** (`/admin/nail-designs`): danh sách + tạo/sửa + duyệt đề xuất.
- [ ] **M6 — Accounts & Config** (`/admin/accounts`): danh sách tài khoản + tạo/sửa/reset mật khẩu + form system-config & loyalty-config.
- [ ] **M7 — Branches** (`/admin/branches`): danh sách chi nhánh + tạo/sửa.
- [ ] **M8 — Gap lẻ**: refund (trong Payments), customer detail/lookup (trong Customers), calendar view, duyệt nghỉ phép (trong Staff), reorder categories (trong Services).

## Verification record

| Module | typecheck | lint | test | build | commit |
|---|---|---|---|---|---|
| M1 | | | | | |
| M2 | | | | | |
| M3 | | | | | |
| M4 | | | | | |
| M5 | | | | | |
| M6 | | | | | |
| M7 | | | | | |
| M8 | | | | | |
