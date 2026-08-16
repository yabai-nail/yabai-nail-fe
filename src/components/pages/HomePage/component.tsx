import Link from "next/link";

/** Draw the customer-facing Atelier Story introduction. */
export const _HomePage = () => (
  <main className="flex flex-1 flex-col">
    <section className="mx-auto grid w-full max-w-7xl flex-1 items-center gap-12 px-4 py-14 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8 lg:py-20">
      <div className="max-w-xl">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-accent-soft-foreground">
          Nail atelier · Sài Gòn
        </p>
        <h1 className="font-display mt-5 text-6xl font-medium italic leading-[0.94] tracking-tight text-foreground sm:text-7xl lg:text-8xl">
          Dịu dàng,
          <span className="block text-brand">theo cách của bạn.</span>
        </h1>
        <p className="mt-7 max-w-lg text-base leading-7 text-muted sm:text-lg sm:leading-8">
          YABAI biến mỗi buổi làm móng thành một khoảng nghỉ riêng tư — nơi
          kỹ thuật chỉn chu gặp cảm hứng thiết kế dành riêng cho bạn.
        </p>

        <div className="mt-9 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/booking/services"
            className="inline-flex min-h-12 items-center justify-center rounded-lg bg-accent px-6 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Đặt lịch trải nghiệm
          </Link>
          <Link
            href="/designs"
            className="inline-flex min-h-12 items-center justify-center rounded-lg border border-border px-6 text-sm font-semibold text-foreground transition-colors hover:bg-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Khám phá bộ sưu tập
          </Link>
        </div>

        <dl className="mt-12 grid grid-cols-3 border-y border-separator py-5">
          <div>
            <dt className="text-xs text-muted">Phong cách</dt>
            <dd className="mt-1 text-sm font-semibold text-foreground">
              Cá nhân
            </dd>
          </div>
          <div className="border-x border-separator px-4">
            <dt className="text-xs text-muted">Chăm sóc</dt>
            <dd className="mt-1 text-sm font-semibold text-foreground">
              Chỉn chu
            </dd>
          </div>
          <div className="pl-4">
            <dt className="text-xs text-muted">Không gian</dt>
            <dd className="mt-1 text-sm font-semibold text-foreground">
              Thư giãn
            </dd>
          </div>
        </dl>
      </div>

      <div
        aria-hidden="true"
        className="relative min-h-[30rem] overflow-hidden rounded-4xl bg-brand shadow-atelier sm:min-h-[36rem]"
      >
        <div className="absolute -right-20 -top-24 size-80 rounded-full border border-accent-foreground/20" />
        <div className="absolute right-8 top-8 size-44 rounded-full bg-brand-blush opacity-75 blur-3xl" />
        <div className="absolute left-8 top-10 max-w-52 text-accent-foreground">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] opacity-70">
            Collection 01
          </p>
          <p className="font-display mt-3 text-5xl font-medium italic leading-none">
            Quiet Bloom
          </p>
        </div>

        <div className="absolute -bottom-14 right-2 flex rotate-[-8deg] items-end gap-2 sm:right-10">
          <span className="h-64 w-14 rounded-t-full rounded-b-3xl bg-brand-soft shadow-xl sm:h-72 sm:w-16" />
          <span className="h-72 w-14 rounded-t-full rounded-b-3xl bg-brand-blush shadow-xl sm:h-80 sm:w-16" />
          <span className="h-80 w-14 rounded-t-full rounded-b-3xl bg-surface shadow-xl sm:h-96 sm:w-16" />
          <span className="h-72 w-14 rounded-t-full rounded-b-3xl bg-brand-hover shadow-xl sm:h-80 sm:w-16" />
        </div>

        <div className="absolute bottom-8 left-8 right-8 flex items-end justify-between border-t border-accent-foreground/20 pt-5 text-accent-foreground">
          <p className="max-w-40 text-xs leading-5 opacity-75">
            Một bộ móng nhẹ như cánh hoa đầu mùa.
          </p>
          <span className="font-display text-3xl italic">YABAI</span>
        </div>
      </div>
    </section>

    <section className="border-t border-separator bg-surface">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-start justify-between gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-center lg:px-8">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent-soft-foreground">
            Khoảnh khắc dành cho bạn
          </p>
          <h2 className="font-display mt-2 text-3xl font-medium italic text-foreground sm:text-4xl">
            Chọn dịch vụ, chi nhánh và thời gian phù hợp.
          </h2>
        </div>
        <Link
          href="/services"
          className="inline-flex min-h-11 shrink-0 items-center border-b border-brand pb-1 text-sm font-semibold text-brand transition-colors hover:text-brand-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          Xem dịch vụ
          <span aria-hidden="true" className="ml-2">
            →
          </span>
        </Link>
      </div>
    </section>
  </main>
);

export const meta = { world: "pure", domain: "home" } as const;
