"use client";

import { useMemo } from "react";

import { useBranches, useBranchServices } from "@/service";

const formatVnd = (value: number): string => `${value.toLocaleString("vi-VN")} ₫`;

const ServicesRoute = () => {
  // The public services list is per-branch. Until the shell offers a branch
  // selector to signed-out customers, land on the first published branch —
  // the salon can wire a chooser later.
  const { branches } = useBranches();
  const defaultBranchId = useMemo(() => branches[0]?.id ?? null, [branches]);
  const { data, isLoading, error } = useBranchServices(defaultBranchId);
  const services = data?.items ?? [];

  return (
    <main className="flex flex-1 flex-col px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent-soft-foreground">
          YABAI Services
        </p>
        <h1 className="font-display mt-3 max-w-3xl text-5xl font-medium italic leading-tight tracking-tight text-foreground sm:text-6xl">
          Dịch vụ nail
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-muted sm:text-lg">
          Khám phá các dịch vụ chăm sóc và thiết kế móng tại YABAI.
        </p>

        <section aria-label="Danh sách dịch vụ" className="mt-12">
          {!defaultBranchId ? (
            <p className="text-sm text-muted">Đang chờ dữ liệu chi nhánh…</p>
          ) : isLoading ? (
            <p className="text-sm text-muted">Đang tải danh sách dịch vụ…</p>
          ) : error ? (
            <p className="text-sm text-danger">Không tải được danh sách dịch vụ. Vui lòng thử lại.</p>
          ) : services.length === 0 ? (
            <p className="text-sm text-muted">Chi nhánh chưa công bố dịch vụ nào.</p>
          ) : (
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((service) => (
                <li
                  key={service.id}
                  className="rounded-2xl border border-border bg-surface p-6 shadow-sm transition hover:border-accent"
                >
                  <h2 className="text-lg font-semibold text-foreground">{service.name}</h2>
                  {service.description ? (
                    <p className="mt-3 text-sm leading-6 text-muted">{service.description}</p>
                  ) : null}
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="font-semibold text-accent">{formatVnd(service.priceVnd)}</span>
                    <span className="text-muted">{service.durationMinutes} phút</span>
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

export default ServicesRoute;
