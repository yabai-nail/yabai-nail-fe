"use client";

import Link from "next/link";
import { useMemo } from "react";

import { useBranches, useBranchServices } from "@/service";

import { formatMoney } from "@/lib/admin-format";

const BookingServicesRoute = () => {
  // Step 1 of the booking journey. The full flow (branch → service → staff
  // → time slot → confirm) is not implemented yet — this page lands the
  // customer on real services from the first published branch, and the
  // "Đặt lịch" CTA anchors to the next step once it exists.
  const { branches } = useBranches();
  const defaultBranchId = useMemo(() => branches[0]?.id ?? null, [branches]);
  const { data, isLoading, error } = useBranchServices(defaultBranchId);
  const services = data?.items ?? [];

  return (
    <main className="flex flex-1 flex-col px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent-soft-foreground">
          YABAI Booking · Bước 1
        </p>
        <h1 className="font-display mt-3 max-w-3xl text-5xl font-medium italic leading-tight tracking-tight text-foreground sm:text-6xl">
          Chọn dịch vụ để đặt lịch
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-muted sm:text-lg">
          Chọn dịch vụ bạn muốn để tiếp tục chọn kỹ thuật viên và thời gian.
        </p>

        <section aria-label="Chọn dịch vụ" className="mt-12">
          {!defaultBranchId ? (
            <p className="text-sm text-muted">Đang chờ dữ liệu chi nhánh…</p>
          ) : isLoading ? (
            <p className="text-sm text-muted">Đang tải dịch vụ…</p>
          ) : error ? (
            <p className="text-sm text-danger">Không tải được dịch vụ. Vui lòng thử lại.</p>
          ) : services.length === 0 ? (
            <p className="text-sm text-muted">Chi nhánh chưa công bố dịch vụ nào.</p>
          ) : (
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((service) => (
                <li
                  key={service.id}
                  className="flex flex-col justify-between rounded-2xl border border-border bg-surface p-6 shadow-sm transition hover:border-accent"
                >
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">{service.name}</h2>
                    {service.description ? (
                      <p className="mt-3 text-sm leading-6 text-muted">{service.description}</p>
                    ) : null}
                    <div className="mt-4 flex items-center justify-between text-sm">
                      <span className="font-semibold text-accent">{formatMoney(service.price)}</span>
                      <span className="text-muted">{service.durationMinutes} phút</span>
                    </div>
                  </div>
                  {/* Anchor for the next booking step. The staff picker /
                      availability grid is not implemented yet; the link is
                      wired so the next PR can drop the target in without
                      touching this page. */}
                  <Link
                    href={{
                      pathname: "/booking",
                      query: { branchId: defaultBranchId, serviceId: service.id },
                    }}
                    className="mt-5 inline-flex items-center justify-center rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition hover:opacity-90"
                  >
                    Đặt lịch →
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
};

export default BookingServicesRoute;
