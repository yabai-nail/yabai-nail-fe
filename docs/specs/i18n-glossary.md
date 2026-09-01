# Từ điển thuật ngữ — console admin

Spec: [SPEC-admin-i18n](./SPEC-admin-i18n.md)

Chốt một từ cho mỗi khái niệm, dùng thống nhất trên cả 16 màn. Không có file này
thì "Hoàn tiền" sẽ thành `返金` ở màn Thanh toán và `払い戻し` ở màn Báo cáo, và
nhân viên đọc hai màn sẽ tưởng là hai thao tác khác nhau.

**File này là nguồn dữ liệu, không phải tài liệu tham khảo.**
`scripts/check-i18n.mjs` đọc trực tiếp các bảng dưới đây. Sửa một hàng ở đây là
đổi luôn thứ mà cổng kiểm tra đối chiếu.

**Đây cũng là thứ cần đưa cho người biết tiếng Nhật soát trước.** Soát 45 thuật
ngữ lõi khả thi; soát 1.164 chuỗi thì không. Sai một từ ở đây là sai ở mọi màn.

Cột VI lấy đúng chuỗi đang có trong code tại `19bbd38`, không phải chữ tự nghĩ ra.

## Vai trò

| VI | JA | EN | Ghi chú |
|---|---|---|---|
| Chủ chuỗi | オーナー | Owner | |
| Quản lý cửa hàng | 店長 | Store manager | `店長` là chức danh chuẩn của người quản lý một cửa hàng |
| Nhân viên | スタッフ | Staff | |
| Khách hàng | 顧客 | Customer | `顧客` khi nói về khách như một **bản ghi dữ liệu**: cột bảng, bộ lọc, số đếm. Dùng `お客様` khi nói về khách như **người được phục vụ** — ví dụ `お客様向けアプリ` (ứng dụng khách hàng). Cổng kiểm tra sẽ báo trường hợp thứ hai; đó là báo nhầm đã biết trước |

## Vòng đời lịch hẹn

Bám đúng `AppointmentStatus` của backend. Đây là nhóm nhạy cảm nhất: nhân viên
đọc trạng thái để quyết định thao tác tiếp theo.

| VI | JA | EN | Ghi chú |
|---|---|---|---|
| Lịch hẹn | 予約 | Appointment | |
| Chờ xác nhận | 確認待ち | Pending confirmation | `PENDING_CONFIRMATION` |
| Đã xác nhận | 確認済み | Confirmed | `CONFIRMED` |
| Đã đến | 来店済み | Checked in | `CHECKED_IN` |
| Đang phục vụ | 施術中 | In service | `IN_SERVICE`. `施術` là từ chuẩn của ngành làm đẹp, không phải `サービス` |
| Chờ thanh toán | 会計待ち | Awaiting payment | `AWAITING_PAYMENT`. `会計` là việc tính tiền tại quầy |
| Hoàn tất | 完了 | Completed | `COMPLETED` |
| Đã hủy | キャンセル済み | Cancelled | |
| Hết hạn | 期限切れ | Expired | `EXPIRED` |
| Không đến | 無断キャンセル | No-show | `NO_SHOW`. Từ nghiệp vụ chuẩn, không dịch chữ-theo-chữ thành `来ない` |

## Tiền

Nhóm phải soát kỹ nhất. Dịch sai ở đây là mất tiền thật, không phải khó hiểu.

| VI | JA | EN | Ghi chú |
|---|---|---|---|
| Thanh toán | 支払い | Payment | |
| Thu tiền | 入金 | Capture | Ghi nhận tiền đã nhận |
| Hoàn tiền | 返金 | Refund | **Không** dùng `払い戻し` |
| Tiền mặt | 現金 | Cash | Hiện là phương thức duy nhất backend ghi nhận |
| Doanh thu | 売上 | Revenue | |
| Hoa hồng | 歩合 | Commission | |
| Điểm tích lũy | ポイント | Points | |
| Hạng thành viên | 会員ランク | Membership tier | |
| Khuyến mãi | キャンペーン | Promotion | |
| Coupon | クーポン | Coupon | |

## Tổ chức và nội dung

| VI | JA | EN | Ghi chú |
|---|---|---|---|
| Chi nhánh | 店舗 | Branch | |
| Dịch vụ | メニュー | Service | `メニュー` giống cách app khách hàng gọi, để hai bên nói cùng một từ |
| Mẫu nail | ネイルデザイン | Nail design | |
| Đánh giá | レビュー | Review | |
| Tài khoản | アカウント | Account | |
| Ghi chú | メモ | Note | |
| Nhật ký | 監査ログ | Audit log | Đây là audit log, không phải log kỹ thuật |
| Báo cáo | レポート | Report | |
| Cài đặt | 設定 | Settings | |
| Tin nhắn | メッセージ | Message | |

## Thao tác

| VI | JA | EN | Ghi chú |
|---|---|---|---|
| Xác nhận | 確認 | Confirm | |
| Hủy | キャンセル | Cancel | |
| Xóa | 削除 | Delete | |
| Lưu | 保存 | Save | |
| Cập nhật | 更新 | Update | |
| Tạo | 作成 | Create | |
| Tìm kiếm | 検索 | Search | |
| Lọc | 絞り込み | Filter | |
| Áp dụng | 適用 | Apply | |
| Đăng xuất | ログアウト | Sign out | |

## Trạng thái giao diện

| VI | JA | EN | Ghi chú |
|---|---|---|---|
| Đang tải | 読み込み中 | Loading | |
| Không tải được | 読み込めません | Failed to load | |
| Chưa có dữ liệu | データがありません | No data | |
| Thành công | 成功 | Succeeded | |
| Thất bại | 失敗 | Failed | |
| Đang xử lý | 処理中 | Processing | |

## Cổng kiểm tra dùng bảng này thế nào

Với mỗi hàng: nếu một giá trị trong `vi.json` **chứa** từ ở cột VI, thì giá trị
cùng khóa trong `ja.json` / `en.json` phải chứa từ ở cột tương ứng. Không khớp
thì báo — **không fail**.

Đây là phép dò chuỗi con, nên nó sai theo hai hướng và cả hai đều biết trước:

- **Báo nhầm**: câu tiếng Nhật diễn đạt lại tự nhiên mà không chứa nguyên từ,
  hoặc tiếng Anh chia động từ khác (`Cancel` vs `Cancelled`). Cách đối chiếu
  chuỗi con không có cách nào phân biệt.
- **Bỏ sót**: dịch sai một từ không nằm trong 45 hàng này thì không ai bắt.

Vì vậy nó chỉ báo, không chặn. Giá trị của nó là chỉ ra chỗ cần nhìn, không phải
phán đúng sai.
