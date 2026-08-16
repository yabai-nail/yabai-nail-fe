import type { ReactNode } from "react";

type AdminTabLabelProps = {
  readonly children: ReactNode;
  readonly count?: number;
};

export function AdminTabLabel({ children, count }: AdminTabLabelProps) {
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap">
      <span>{children}</span>
      {count === undefined ? null : (
        <span className="tabular-nums text-admin-accent">{count}</span>
      )}
    </span>
  );
}
