"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo } from "react";

import { useBranches, useBranchServices, type Branch } from "@/service";

import { formatMoney } from "@/lib/admin-format";

export const resolveBookingBranchId = (
  branches: ReadonlyArray<Pick<Branch, "id">>,
  requestedBranchId: string | null,
) => {
  if (requestedBranchId && branches.some((branch) => branch.id === requestedBranchId)) {
    return requestedBranchId;
  }

  return branches[0]?.id ?? null;
};

const BookingServicesContent = () => {
  const searchParams = useSearchParams();
  const { branches } = useBranches();
  const requestedBranchId = searchParams.get("branchId");
  const selectedBranchId = useMemo(
    () => resolveBookingBranchId(branches, requestedBranchId),
    [branches, requestedBranchId],
  );
  const selectedBranch = branches.find((branch) => branch.id === selectedBranchId);
  const { data, isLoading, error } = useBranchServices(selectedBranchId);
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
        {selectedBranch ? (
          <p className="mt-3 text-sm text-muted">
            Chi nhánh: <strong className="text-foreground">{selectedBranch.name}</strong>
          </p>
        ) : null}

        <section aria-label="Chọn dịch vụ" className="mt-12">
          {!selectedBranchId ? (
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
                      query: { branchId: selectedBranchId, serviceId: service.id },
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

const BookingServicesRoute = () => (
  <Suspense fallback={<p className="px-4 py-16 text-sm text-muted">Đang tải dịch vụ…</p>}>
    <BookingServicesContent />
  </Suspense>
);

export default BookingServicesRoute;
