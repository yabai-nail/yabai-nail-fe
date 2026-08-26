# Plan — Admin: rà E2E toàn bộ 16 màn và vá lỗi phát hiện

Ngày rà: 2026-08-26 · Nhánh gốc: `main` @ `4c48507` → `9633fa4`

## Vì sao có đợt này

Sổ E2E trước đó đếm **thao tác ghi của API** (59 endpoint). Cách đo đó có một
điểm mù không thể vá bằng cách đếm kỹ hơn: **một nút không có handler thì không
gọi endpoint nào**, nên nó không bao giờ xuất hiện trong bảng đếm theo endpoint,
kể cả khi bảng đó đạt 100%. Đối chiếu bằng `audit_logs` cũng dính đúng điểm mù
ấy — "không có audit row" bị đọc thành *"thao tác chưa được test"*, chưa bao giờ
đọc thành *"không có nút nào chạm tới được thao tác này"*.

Đợt này đo theo trục khác: **mỗi màn được một người bấm tay ít nhất một lần**,
cộng ba bản quét tĩnh cho các lớp lỗi mà bấm tay dễ bỏ sót.

## Cách làm

1. Bấm tay 16/16 màn admin trên dev server nối API production.
2. Ba bản quét tĩnh: nút không handler · link không đi đâu · dữ liệu demo hiển
   thị như thật.
3. Đối chiếu `GET /admin/audit-logs` để biết thao tác nào thực sự đã từng chạy.
4. Mỗi nhóm lỗi: vá → `lint` + `test` + `build` → commit riêng → merge `--no-ff`.

## Phạm vi đã bấm tay

- [x] Tổng quan · [x] Lịch hẹn · [x] Khách hàng · [x] Tin nhắn
- [x] Thanh toán · [x] Nhân viên · [x] Dịch vụ · [x] Mẫu nail
- [x] Đánh giá · [x] Marketing · [x] Báo cáo · [x] Chi nhánh
- [x] Tài khoản (cả tab Cấu hình) · [x] Vận hành · [x] Nhật ký · [x] Cài đặt (8 tab)

## Lỗi đã vá

| # | Triệu chứng | Nguyên nhân gốc | Vị trí | Commit |
|---|---|---|---|---|
| 1 | Badge "12 thông báo chưa đọc" luôn hiện | chuỗi cứng trong component | `AdminShell/component.tsx` | `d54d24f` |
| 2 | Lời chào luôn "buổi sáng", ngày cứng `16/08/2026`, badge `18` tin nhắn (DB có 0 hội thoại) | ba chuỗi cứng trong config | `AdminShell/config.ts` | `d52be32` |
| 3 | Lịch hẹn `COMPLETED` hiện "Đã xác nhận"; bộ đếm ngày sai | `normalizeStatus` gộp `complete`/`service` vào `confirmed` bằng so khớp chuỗi con | `AdminAppointments/status.ts` | `d52be32` |
| 4 | Khuyến mãi tạo qua UI **không bao giờ phát hành được** | không màn nào gửi `status`; BE mặc định `DRAFT`, mà phát hành đòi `ACTIVE` | `AdminMarketing/component.tsx` | `d52be32` |
| 5 | Phát hành khuyến mãi bắt dán UUID khách | không có bộ chọn khách | `AdminMarketing/IssueModal.tsx` | `d52be32` |
| 6 | Nút "Sửa"/"Đặt lại MK" hiện trên tài khoản Khách hàng, backend luôn từ chối | không lọc theo role | `AdminAccounts/component.tsx` | `d52be32` |
| 7 | Ô lọc là `<select>` gốc, danh sách xổ ra do hệ điều hành vẽ | chưa có component select của design system | `blocks/admin/AdminSelectField` | `a59e2c8` |
| 8 | 22 ô `<select>` thô trên 16 màn | như trên | 16 file | `fc3d7cb` |
| 9 | Nút "…" và "Bộ lọc" ở màn Khách hàng không làm gì | không có `onPress`, `CustomerTable` không nhận callback | `AdminCustomers/` | `e12b62b` |
| 10 | **16 nút không handler** trên 10 màn, gồm cả **Đăng xuất** ở sidebar | — | 13 file | `231a93a` |
| 11 | Phân trang khách hàng: 3 nút trang cứng, tổng lấy từ `pageInfo.limit` (2 khách → "20 khách hàng") | — | `AdminCustomers/component.tsx` | `231a93a` |
| 12 | **Mọi modal trong suốt**, nhìn xuyên thấy trang | HeroUI portal modal ra cuối `<body>`, ngoài `.admin-shell` — nơi duy nhất khai `--admin-*`, nên `bg-admin-surface` trỏ biến rỗng | `app/globals.css` | `cb7bd5a` |
| 13 | Màn Đánh giá trống 4/5 cột | type khai tay đọc `rating`/`content`/`handling.status`/`reply.content`; API gửi `serviceRating`/`staffRating`/`comment`/`managerReply`/`handlingStatus` | `service/admin/types.ts`, `AdminReviews/data.ts` | `cb7bd5a` |
| 14 | Bỏ đánh dấu "Đã xử lý" trả 422 | gửi `PENDING`; API chỉ nhận `NEW`/`IN_PROGRESS`/`RESOLVED` | `AdminReviews/component.tsx` | `cb7bd5a` |
| 15 | Màn Tổng quan tự mâu thuẫn: danh sách ghi "Chờ xác nhận" ngay dưới dòng đếm "Hoàn tất: 2" | panel giữ ánh xạ hai chiều riêng | `AdminDashboard/AppointmentsPanel.tsx` | `cb7bd5a` |
| 16 | Tổng quan hiện `Khách #596b00`, `Dịch vụ #2de276` | không join tên | như trên | `cb7bd5a` |
| 17 | **Modal cắt mất footer** — ở viewport cao 600px, nội dung 784px trong dialog 520px, mất cả nút "Tạo lịch hẹn" | `<form>` bọc Body+Footer là block, không co được trong flex column của dialog | 3 modal | `09018e5` |

Chi tiết #13 đáng ghi lại riêng: **test đơn vị cũng assert đúng hợp đồng tưởng
tượng đó** nên xanh suốt trong khi màn hình trống. Bản vá thay cả type lẫn test
bằng payload đọc thật từ production.

## Ba bản quét tĩnh

| Lớp lỗi | Trước | Sau |
|---|---|---|
| `<Button>`/`<button>` không `onPress`/`onClick`/`submit`/`href` | 16 | **0** |
| `<a>`/`<Link>` với `href` rỗng hoặc `#` | 0 | 0 |
| Dữ liệu demo hiển thị như thật (không tính `placeholder`) | 2 | 2 (xem phần chưa vá) |

> Script quét hiện nằm ngoài repo. **Nên đưa vào `scripts/` và chạy trong CI** —
> chúng tìm ra 16 nút chết trong vài giây, và đây là lớp lỗi `lint`/`test`/`build`
> đều không thấy.

## Chưa vá — cần quyết định

| Vấn đề | Vì sao chưa vá |
|---|---|
| `AdminMessages/CustomerSummary.tsx:37` hiện lịch hẹn giả `17/05/2025` | chỉ lộ khi có hội thoại, mà hội thoại không tạo được (BE-GAP-001) |
| `AdminPayments/CustomerAppointmentPanel.tsx` danh sách nhân viên cứng `Mai Linh / Thảo Vy / Quỳnh Anh` | chỉ hiện ở chế độ mô phỏng, đã có nhãn "Bản mô phỏng nội bộ" |
| Màn Báo cáo hiện nhãn khoá API thô: `RECOGNIZED REVENUE`, `COMPLETED APPOINTMENT COUNT`, `BRANCH ID` | cần chốt bản dịch |
| Màn Vận hành bắt dán UUID (hoàn tiền theo ID thanh toán, duyệt nghỉ theo ID yêu cầu) | không màn nào hiển thị các ID đó; cần BE có list hoặc FE có bộ chọn |
| Cấu hình tích điểm sửa bằng JSON thô | cần thiết kế form |
| Cột "Điện thoại" ở màn Chi nhánh luôn `—` | API `/branches` không trả trường này (BE-GAP-012) |
| Dữ liệu test trên production | Không xoá được qua API — không-xoá-cứng là thiết kế cố ý, xem BE-GAP-013. Cần thao tác DB có backup. |
| 7 thao tác nhật ký không kết luận được | handler BE không ghi audit row, không xác định được đã test hay chưa |
| 3 thao tác bất khả thi | BE-GAP-001 / BE-GAP-011 |

## Bảo mật — ngoài phạm vi đợt này, cần xử lý riêng

`OTP_BYPASS_CODE` đang bật trên production. `/verify` cấp session cho bất kỳ tài
khoản nào sở hữu số điện thoại của challenge, **kèm role của nó**. Số điện thoại
chủ chuỗi nằm trong một spec ở repo public kèm luôn mã. Comment trong
`platform.controller.ts` dặn gỡ biến này và xoay lại mọi credential đi qua được
nó trước khi có khách thật.

## Verification record

| Đợt | lint | test | build | commit merge |
|---|---|---|---|---|
| Badge thông báo | ✅ | ✅ 206 | ✅ 25/25 | `66312d8` |
| 5 lỗi bấm tay | ✅ | ✅ 215 | ✅ 25/25 | `5eacdc7` |
| Select design system | ✅ | ✅ 215 | ✅ 25/25 | `c64025c` |
| Thao tác hàng khách hàng | ✅ | ✅ 215 | ✅ 25/25 | `4fe32fd` |
| 16 nút chết | ✅ | ✅ 215 | ✅ 25/25 | `c75be96` |
| Đánh giá + Tổng quan + modal trong suốt | ✅ | ✅ 216 | ✅ 25/25 | `3d1d61d` |
| Modal cắt footer | ✅ | ✅ 216 | ✅ 25/25 | `9633fa4` |

Test suite: **206 → 216**. Bản vá ánh xạ trạng thái được thử nghịch — revert bản
vá thì 5 test đỏ, khôi phục thì xanh, nên test không sống sót khi revert chính nó.

## Bài học ghi lại cho lần sau

1. **Độ phủ theo endpoint không nói gì về việc bấm được hay không.** Hai câu hỏi
   khác nhau; đừng báo cáo câu sau bằng số liệu của câu trước.
2. **`docs/frontend-api-map.md` chỉ tới mức method/path.** Lỗi #13 sống được vì
   không tài liệu nào theo dõi mức **tên trường**. `scripts/check-api-contract.mjs`
   có kiểm tên trường nhưng **không phủ reviews**.
3. **Type khai tay + test viết theo type đó = hợp đồng tưởng tượng tự xác nhận.**
   Probe API thật trước khi viết type, và để test assert payload thật.
4. **`lint` + `test` + `build` không thấy nút chết, modal trong suốt, hay modal
   cắt footer.** Ba lớp đó chỉ lộ khi mở trình duyệt hoặc chạy quét tĩnh.
