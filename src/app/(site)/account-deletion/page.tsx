import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Yêu cầu xóa tài khoản — Yabai Nail",
  description:
    "Cách yêu cầu xóa tài khoản Yabai Nail và dữ liệu liên quan của bạn.",
};

const AccountDeletionRoute = () => {
  return (
    <main className="flex flex-1 flex-col px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent-soft-foreground">
          Yabai Nail
        </p>
        <h1 className="font-display mt-3 text-4xl font-medium italic leading-tight tracking-tight text-foreground sm:text-5xl">
          Yêu cầu xóa tài khoản
        </h1>
        <p className="mt-5 text-base leading-7 text-muted">
          Bạn có thể yêu cầu xóa tài khoản Yabai Nail và dữ liệu liên quan bằng một
          trong hai cách dưới đây.
        </p>

        <div className="mt-10 space-y-6">
          <section className="rounded-2xl border border-accent bg-surface p-6">
            <h2 className="text-lg font-semibold text-foreground">
              Cách 1 — Trong ứng dụng (nhanh nhất)
            </h2>
            <ol className="mt-4 space-y-3 text-base leading-7 text-foreground">
              <li>1. Mở ứng dụng Yabai Nail và đăng nhập.</li>
              <li>
                2. Vào <strong>Hồ sơ → Cài đặt</strong>.
              </li>
              <li>
                3. Chọn <strong>Xóa tài khoản</strong> và xác nhận.
              </li>
            </ol>
          </section>

          <section className="rounded-2xl border border-border bg-surface p-6">
            <h2 className="text-lg font-semibold text-foreground">Cách 2 — Qua email</h2>
            <p className="mt-3 text-base leading-7 text-muted">
              Gửi email tới địa chỉ bên dưới với tiêu đề{" "}
              <strong className="text-foreground">“Yêu cầu xóa tài khoản”</strong>, kèm
              số điện thoại đã đăng ký. Chúng tôi xử lý trong vòng{" "}
              <strong className="text-foreground">30 ngày</strong>.
            </p>
            <p className="mt-3">
              <a
                href="mailto:yabainail@gmail.com?subject=Y%C3%AAu%20c%E1%BA%A7u%20x%C3%B3a%20t%C3%A0i%20kho%E1%BA%A3n"
                className="font-medium text-accent underline"
              >
                yabainail@gmail.com
              </a>
            </p>
          </section>
        </div>

        <div className="mt-10 space-y-6 text-base leading-7 text-foreground">
          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">Dữ liệu sẽ bị xóa</h2>
            <p className="text-muted">
              Thông tin tài khoản (số điện thoại, họ tên, email, ảnh đại diện), lịch sử
              trò chuyện và ảnh đã gửi, mẫu nail đã lưu, cùng các tùy chọn cá nhân.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">
              Dữ liệu được giữ lại
            </h2>
            <p className="text-muted">
              Một số bản ghi đặt lịch và giao dịch có thể được lưu giữ trong thời gian
              pháp luật (kế toán, thuế) yêu cầu, sau đó sẽ bị xóa hoặc ẩn danh.
            </p>
          </section>
        </div>

        <p className="mt-10 text-sm text-muted">
          Xem thêm{" "}
          <Link href="/privacy" className="font-medium text-accent underline">
            Chính sách quyền riêng tư
          </Link>
          . Mọi thắc mắc về dữ liệu, liên hệ yabainail@gmail.com.
        </p>
      </div>
    </main>
  );
};

export default AccountDeletionRoute;
