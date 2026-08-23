"use client";

import { useBranches } from "@/service";

// A Next server-metadata export can't sit next to `"use client"`, so the
// dynamic list is a client component; static metadata is generated from a
// parent layout instead.

const BranchesRoute = () => {
  const { branches, isLoading, error } = useBranches();

  return (
    <main className="flex flex-1 flex-col px-4 py-16 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent-soft-foreground">
          YABAI Locations
        </p>
        <h1 className="font-display mt-3 max-w-3xl text-5xl font-medium italic leading-tight tracking-tight text-foreground sm:text-6xl">
          Chọn chi nhánh
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-muted sm:text-lg">
          Chi nhánh YABAI thuận tiện nhất cho lịch hẹn của bạn.
        </p>

        <section aria-label="Danh sách chi nhánh" className="mt-12">
          {isLoading ? (
            <p className="text-sm text-muted">Đang tải danh sách chi nhánh…</p>
          ) : error ? (
            <p className="text-sm text-danger">Không tải được danh sách chi nhánh. Vui lòng thử lại.</p>
          ) : branches.length === 0 ? (
            <p className="text-sm text-muted">Chưa có chi nhánh nào được công bố.</p>
          ) : (
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {branches.map((branch) => (
                <li
                  key={branch.id}
                  className="rounded-2xl border border-border bg-surface p-6 shadow-sm transition hover:border-accent"
                >
                  <h2 className="text-xl font-semibold text-foreground">{branch.name}</h2>
                  <p className="mt-3 text-sm leading-6 text-muted">{branch.address}</p>
                  <p className="mt-4 text-xs uppercase tracking-wide text-muted">
                    {branch.timezone}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
};

export default BranchesRoute;
