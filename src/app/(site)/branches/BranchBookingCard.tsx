import Link from "next/link";

import type { Branch } from "@/service";

interface BranchBookingCardProps {
  readonly branch: Branch;
}

export const BranchBookingCard = ({ branch }: BranchBookingCardProps) => (
  <li>
    <Link
      href={{ pathname: "/booking/services", query: { branchId: branch.id } }}
      aria-label={`Chọn dịch vụ tại ${branch.name}`}
      className="group block h-full rounded-2xl border border-border bg-surface p-6 shadow-sm transition hover:border-accent focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
    >
      <h2 className="text-xl font-semibold text-foreground">{branch.name}</h2>
      <p className="mt-3 text-sm leading-6 text-muted">{branch.address}</p>
      <p className="mt-4 text-xs uppercase tracking-wide text-muted">{branch.timezone}</p>
      <p className="mt-5 text-sm font-semibold text-accent">
        Chọn dịch vụ <span aria-hidden="true">→</span>
      </p>
    </Link>
  </li>
);
