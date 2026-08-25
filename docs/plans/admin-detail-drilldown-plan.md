# Plan — Admin: wire 18 admin op còn thiếu UI

Spec: [SPEC-admin-detail-drilldown](../specs/SPEC-admin-detail-drilldown.md)

Additive vào màn hình đang chạy; full test sau mỗi nhóm để chống regression. Commit theo nhóm.

## Nhóm & trạng thái

- [ ] **A — Admin-auth (5)**: đổi mật khẩu (Settings) + quên mật khẩu (LoginModal) + session bootstrap (shell header) + đổi chi nhánh qua API (BranchSelector).
- [ ] **B — Detail drawers (9)**: audit detail, branch detail, customer detail, staff detail (+hook mới), appointment payments, refund detail, report-export status, org reviews tab, calendar view.
- [ ] **C — Campaign by id (3)**: metrics + cancel + audience-preview panel (Marketing/Chiến dịch).
- [ ] **D — Reorder categories (1)**: nút lên/xuống (Services).

## Verification record

| Nhóm | tsc | lint | full test | commit |
|---|---|---|---|---|
| A | | | | |
| B | | | | |
| C | | | | |
| D | | | | |
