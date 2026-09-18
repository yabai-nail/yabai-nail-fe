# Admin: báo cáo doanh thu theo khách & lương (đợt 2 và 3)

Spec và kế hoạch đầy đủ nằm ở repo API: `yabai-nail-platform/docs/payroll-sales-reports.md`, `payroll-sales-reports-plan.md`, `payroll-sales-reports-todo.md`. File này chỉ tóm tắt phần admin để người làm FE đọc nhanh.

## Đợt 2 – nhánh `feat/admin-payroll` (sau khi API đợt 1 đã deploy)

| Task | Màn / file | Ghi chú |
|---|---|---|
| T10 | `src/service/api/operations.ts` (+ test đếm), `src/service/admin/{types,service,hooks}.ts`, `src/lib/sales-report-engine.ts` (+ test) | Engine FE là bản sao hàm thuần của BE, cùng 8 vector test, chỉ để hiện số trước khi gửi |
| T11a | `src/components/pages/admin/AdminSalesReports/` (`/admin/sales-reports`) | Lọc ngày / tháng, NV, nền tảng, trạng thái, PTTT; chọn nhiều; duyệt / từ chối (lý do); duyệt cả ngày |
| T11b | `AdminSalesReports/ReportModal.tsx` | Sửa mọi trường, nhập hộ chọn NV, hiện số tính thử, 409 khi kỳ đã khoá |
| T12 | `src/components/pages/admin/AdminPayroll/` (`/admin/payroll`) | Tháng / chi nhánh, bảng theo NV + tổng, "Đã thanh toán", "Mở khoá" (OWNER), 2 nút xuất file qua flow report-exports sẵn có |
| T13 | `AdminStaff/StaffCompensationForm.tsx`, `AdminSettings/CommissionTable.tsx` | Thêm "% hoa hồng APP" |
| T14 | `AdminAccounts/` | Thẻ đếm theo vai (bấm = lọc), bảng "vai này làm được gì" từ `GET /admin/accounts/roles`, cột Hồ sơ nhân viên + Liên kết / Bỏ liên kết, cảnh báo STAFF chưa liên kết |
| – | `src/components/layouts/AdminShell/config.ts`, `messages/{vi,en,ja}.json` | Route + `requiredAnyPermission`; i18n chèn bằng text, không JSON round-trip |

Gate: `npx tsc --noEmit`, `node ./scripts/check-i18n.mjs`, `node ./scripts/check-ui-invariants.mjs`, `npx vitest run src`, `pnpm build`.

## Đợt 3 – nhánh `feat/admin-staff-report`

| Task | Màn / file | Ghi chú |
|---|---|---|
| T16a | `AdminStaffReport/` (`/admin/report`) | Một cột, nút to, dùng được trên điện thoại (AdminShell đã có drawer); ngày lùi ≤ 3; 5 nút nền tảng; số tính thử; "Chính tôi" cho vai có hồ sơ |
| T16b | `AdminStaffReport/MyReports.tsx` | Danh sách của tôi theo ngày, trạng thái, lý do từ chối, sửa / xoá khi PENDING |
| T17 | `AdminMyPayroll/` (`/admin/me/payroll`) | Thu nhập của tôi theo tháng |
| T18 | `AdminStaff/StaffPerformancePanel.tsx` | Đọc `GET /admin/payroll` thay cho `staff-performance` cũ |

Quyền STAFF chỉ có `sales.report.*.own` và `payroll.read.own`; menu của STAFF: Báo cáo khách, Lịch của tôi, Thu nhập của tôi.
