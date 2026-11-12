import { Card } from "@heroui/react";
import type { ComponentType, ReactNode } from "react";

type IconType = ComponentType<{ className?: string; "aria-hidden"?: boolean }>;

/**
 * The one card shape for the summary row above the service list, so best sellers, surcharges
 * and the visibility note line up: the same icon tile, title and one-line subtitle in the
 * header, an optional action at its right, and a body that fills the row's shared height.
 */
export function ServiceInfoCard({
  icon: Icon,
  title,
  subtitle,
  action,
  children,
}: Readonly<{
  icon: IconType;
  title: string;
  subtitle: string;
  action?: ReactNode;
  children: ReactNode;
}>) {
  return (
    <Card className="h-full gap-0 rounded-lg border-admin-border bg-admin-surface p-0 shadow-none">
      <Card.Header className="flex flex-row items-start gap-3 border-b border-admin-border px-4 py-3.5">
        <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-lg bg-admin-soft text-admin-accent">
          <Icon aria-hidden className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-bold text-admin-ink">{title}</h2>
          <p className="mt-0.5 text-xs text-admin-muted">{subtitle}</p>
        </div>
        {action}
      </Card.Header>
      <Card.Content className="flex flex-1 flex-col p-4">{children}</Card.Content>
    </Card>
  );
}

/** The empty state every card in the row shares, so "nothing yet" reads the same in each. */
export function ServiceInfoEmpty({ icon: Icon, children }: Readonly<{ icon: IconType; children: ReactNode }>) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-admin-border px-4 py-6 text-center text-xs text-admin-muted">
      <Icon aria-hidden className="size-5" />
      <p>{children}</p>
    </div>
  );
}
