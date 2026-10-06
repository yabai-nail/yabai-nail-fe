import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Chính sách quyền riêng tư — Yabai Nail",
  description:
    "Cách ứng dụng Yabai Nail thu thập, sử dụng và bảo vệ thông tin của bạn.",
};

const LAST_UPDATED = "06/10/2026";

const PrivacyRoute = () => {
  return (
    <main className="flex flex-1 flex-col px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent-soft-foreground">
          Yabai Nail
        </p>
        <h1 className="font-display mt-3 text-4xl font-medium italic leading-tight tracking-tight text-foreground sm:text-5xl">
          Chính sách quyền riêng tư
        </h1>
        <p className="mt-4 text-sm text-muted">Cập nhật lần cuối: {LAST_UPDATED}</p>

        <div className="mt-10 space-y-8 text-base leading-7 text-foreground">
          <p>
            Tedo (“chúng tôi”) vận hành ứng dụng <strong>Yabai Nail</strong> (“ứng
            dụng”). Chính sách này giải thích chúng tôi thu thập, sử dụng và chia sẻ
            thông tin của bạn như thế nào khi bạn dùng ứng dụng.
          </p>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">
              1. Thông tin chúng tôi thu thập
            </h2>
            <ul className="list-disc space-y-2 pl-5 text-muted">
              <li>
                <strong className="text-foreground">Thông tin tài khoản:</strong> số
                điện thoại, họ tên, email (dùng để xác nhận đặt lịch), mật khẩu (được
                mã hóa), ảnh đại diện nếu bạn tải lên.
              </li>
              <li>
                <strong className="text-foreground">Dữ liệu đặt lịch:</strong> dịch
                vụ, chi nhánh, khung giờ và lịch sử cuộc hẹn.
              </li>
              <li>
                <strong className="text-foreground">Tin nhắn &amp; hình ảnh:</strong>{" "}
                nội dung và ảnh bạn gửi khi trò chuyện với salon, và ảnh bạn gửi cho
                tính năng tư vấn mẫu bằng AI.
              </li>
              <li>
                <strong className="text-foreground">Điểm thành viên và ưu đãi.</strong>
              </li>
              <li>
                <strong className="text-foreground">
                  Thông tin thiết bị &amp; thông báo:
                </strong>{" "}
                mã định danh thiết bị, mã thông báo đẩy, nền tảng (iOS/Android), ngôn
                ngữ và phiên bản ứng dụng — để gửi thông báo và nhắc lịch.
              </li>
              <li>
                <strong className="text-foreground">Thư viện ảnh:</strong> chỉ truy
                cập khi bạn chủ động chọn ảnh để gửi. Chúng tôi không xem ảnh của bạn
                khi chưa được bạn chọn.
              </li>
            </ul>
            <p className="text-muted">
              Chúng tôi <strong className="text-foreground">không</strong> thu thập vị
              trí của bạn.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">
              2. Mục đích sử dụng
            </h2>
            <p className="text-muted">
              Để tạo tài khoản và đăng nhập; xử lý đặt lịch và nhắc hẹn; trao đổi với
              bạn qua chat; cung cấp gợi ý mẫu nail bằng AI; quản lý điểm thành viên và
              ưu đãi; cải thiện và bảo mật dịch vụ.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">
              3. Chia sẻ với bên thứ ba
            </h2>
            <p className="text-muted">
              Chúng tôi <strong className="text-foreground">không bán</strong> dữ liệu
              của bạn. Chúng tôi chỉ chia sẻ ở mức cần thiết với:
            </p>
            <ul className="list-disc space-y-2 pl-5 text-muted">
              <li>Nhà cung cấp hạ tầng máy chủ và lưu trữ hình ảnh của chúng tôi;</li>
              <li>
                Nhà cung cấp dịch vụ AI, để xử lý ảnh và nội dung bạn gửi cho tính năng
                tư vấn mẫu;
              </li>
              <li>Dịch vụ gửi thông báo đẩy (ví dụ Google Firebase);</li>
              <li>Nhà cung cấp đăng nhập mạng xã hội, nếu bạn chọn đăng nhập bằng Google.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">
              4. Lưu trữ &amp; bảo mật
            </h2>
            <p className="text-muted">
              Dữ liệu được truyền qua kết nối mã hóa (HTTPS). Hình ảnh riêng tư trong
              chat chỉ truy cập được qua liên kết ký tạm thời, có thời hạn ngắn. Chúng
              tôi áp dụng các biện pháp hợp lý để bảo vệ dữ liệu của bạn.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">5. Quyền của bạn</h2>
            <p className="text-muted">
              Bạn có thể xem và chỉnh sửa thông tin cá nhân trong ứng dụng, và yêu cầu
              xóa tài khoản bất cứ lúc nào — xem hướng dẫn tại{" "}
              <Link href="/account-deletion" className="font-medium text-accent underline">
                trang Yêu cầu xóa tài khoản
              </Link>
              .
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">6. Trẻ em</h2>
            <p className="text-muted">
              Ứng dụng không hướng đến trẻ em dưới 16 tuổi và chúng tôi không cố ý thu
              thập dữ liệu của trẻ em.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">
              7. Thay đổi chính sách
            </h2>
            <p className="text-muted">
              Chúng tôi có thể cập nhật chính sách này. Mọi thay đổi sẽ được đăng tại
              trang này kèm ngày cập nhật mới.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">8. Liên hệ</h2>
            <div className="rounded-2xl border border-border bg-surface p-6">
              <p className="font-semibold text-foreground">Tedo — Yabai Nail</p>
              <p className="mt-1 text-muted">
                Email hỗ trợ:{" "}
                <a href="mailto:yabainail@gmail.com" className="font-medium text-accent underline">
                  yabainail@gmail.com
                </a>
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
};

export default PrivacyRoute;
