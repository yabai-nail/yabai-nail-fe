# Task list — Đa ngôn ngữ cho console admin

Spec: [SPEC-admin-i18n](../specs/SPEC-admin-i18n.md)

Mỗi lát: `pnpm lint` + `pnpm test` + `pnpm build` + `pnpm ui:check` + `pnpm i18n:check`,
rồi commit. Dừng ở bất kỳ lát nào console vẫn chạy — màn chưa rút vẫn là tiếng Việt cứng.

## Hạ tầng

- [x] **L0** Spec
- [x] **L1** `src/i18n/{config,locale,messages}.ts`, `messages/{vi,ja,en}.json`,
      admin layout đọc locale, `scripts/check-i18n.mjs` (chế độ báo cáo)
- [x] **L2** Tab **Ngôn ngữ** trong `/admin/settings` (ghi cookie + `router.refresh()`)
- [ ] **L2b** Ghi cookie từ `AdminSession.locale` một lần sau đăng nhập

## Dùng chung (phải xong trước các màn)

- [ ] **L3** `components/layouts/` — AdminShell, ShellNav, AdminAuthGate

## 16 màn

- [ ] **L4** Tổng quan (`AdminDashboard`)
- [ ] **L5** Lịch hẹn (`AdminAppointments`)
- [ ] **L6** Khách hàng (`AdminCustomers`)
- [ ] **L7** Thanh toán (`AdminPayments`)
- [ ] **L8** Nhân viên (`AdminStaff`)
- [ ] **L9** Dịch vụ (`AdminServices`)
- [ ] **L10** Mẫu nail (`AdminNailDesigns`)
- [ ] **L11** Đánh giá (`AdminReviews`)
- [ ] **L12** Marketing (`AdminMarketing`)
- [ ] **L13** Báo cáo (`AdminReports`)
- [ ] **L14** Chi nhánh (`AdminBranches`)
- [ ] **L15** Tài khoản (`AdminAccounts`)
- [ ] **L16** Vận hành (`AdminOperations`)
- [ ] **L17** Nhật ký (`AdminAuditLogs`)
- [ ] **L18** Cài đặt (`AdminSettings`)
- [ ] **L19** Tin nhắn (`AdminMessages`) + đăng nhập (`AdminLogin`)

## Dịch và chốt

- [ ] **L20** Sinh `en.json`
- [ ] **L21** Sinh `ja.json`
- [ ] **L22** Bật `ENFORCE_LEAKS` trong `check-i18n.mjs`, nối vào CI

## Ghi lại khi làm

- Số dòng còn hardcode sau mỗi lát (chạy `pnpm i18n:check`): **L1 = 1224 dòng / 116 file**
- Gap BE cần ghi: endpoint lưu locale cho admin (mục 4 của spec)
