"use client";

import { useNailDesigns } from "@/service";

const DesignsRoute = () => {
  const { data, isLoading, error } = useNailDesigns();
  const designs = data?.items ?? [];

  return (
    <main className="flex flex-1 flex-col px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent-soft-foreground">
          YABAI Collection
        </p>
        <h1 className="font-display mt-3 max-w-3xl text-5xl font-medium italic leading-tight tracking-tight text-foreground sm:text-6xl">
          Bộ sưu tập mẫu nail
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-muted sm:text-lg">
          Không gian tuyển chọn những mẫu nail mới nhất để bạn tìm cảm hứng
          trước khi đặt lịch.
        </p>

        <section aria-label="Bộ sưu tập mẫu nail" className="mt-12">
          {isLoading ? (
            <p className="text-sm text-muted">Đang tải bộ sưu tập…</p>
          ) : error ? (
            <p className="text-sm text-danger">Không tải được bộ sưu tập. Vui lòng thử lại.</p>
          ) : designs.length === 0 ? (
            <p className="text-sm text-muted">Bộ sưu tập đang được cập nhật.</p>
          ) : (
            <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {designs.map((design) => (
                <li
                  key={design.id}
                  className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm transition hover:border-accent"
                >
                  {design.imageUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      alt={design.name}
                      className="aspect-square w-full object-cover"
                      src={design.imageUrl}
                    />
                  ) : (
                    <div className="grid aspect-square w-full place-items-center bg-accent-soft text-xs text-accent-soft-foreground">
                      YABAI
                    </div>
                  )}
                  <div className="px-4 py-3">
                    <p className="text-sm font-semibold text-foreground">{design.name}</p>
                    {typeof design.favoriteCount === "number" ? (
                      <p className="mt-1 text-xs text-muted">
                        ♡ {design.favoriteCount.toLocaleString("vi-VN")}
                      </p>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
};

export default DesignsRoute;
