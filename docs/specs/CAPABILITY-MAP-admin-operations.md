# Capability Map: YABAI Admin Operations

## Trạng thái

- Đã được duyệt ngày 2026-08-16.
- Phạm vi hiện tại gồm năm màn nghiệp vụ từ ảnh tham chiếu; ảnh khách hàng bị lặp được tính là một màn.
- Màn lịch hẹn không nằm trong phạm vi của map này.

| Module id | Trách nhiệm | Phụ thuộc |
|---|---|---|
| `admin-foundation` | Header theo route, sidebar theo route và các primitive dùng chung cho trang quản trị | `AdminShell` hiện tại |
| `admin-customers` | Danh sách, tìm kiếm, phân nhóm và chi tiết khách hàng tại `/admin/customers` | `admin-foundation` |
| `admin-messages` | Hộp thư, hội thoại và thông tin khách hàng tại `/admin/messages` | `admin-foundation` |
| `admin-staff` | KPI, danh sách, chi tiết nhân viên và đơn hàng gần đây tại `/admin/staff` | `admin-foundation` |
| `admin-services` | Danh sách, danh mục và dịch vụ bán chạy tại `/admin/services` | `admin-foundation` |
| `admin-settings` | Cấu hình nhân viên và hoa hồng tại `/admin/settings` | `admin-foundation`, `admin-staff` |

Build order: `admin-foundation` → `admin-customers`, `admin-messages`, `admin-staff`, `admin-services` → `admin-settings`

## Nguyên tắc xuyên suốt

- Dùng HeroUI cho primitive tương tác và Heroicons cho icon.
- Dùng dữ liệu fixture có type; chưa kết nối backend hoặc thực hiện mutation thật.
- Tách presentation khỏi dữ liệu và trạng thái tương tác.
- Các bảng, toolbar, badge, avatar, detail panel và page header phải được tái sử dụng khi contract giống nhau.
- Giữ design token admin hiện tại: trắng sạch, viền nhẹ, màu chủ đạo `#d8145b`, bán kính `0.5rem`.
- Mỗi route phải responsive, truy cập được bằng bàn phím và có semantic heading/table.
