import type { ComponentType, SVGProps } from "react";

export type SystemNoticeDetail = {
  readonly label: string;
  readonly value: string;
  readonly icon: ComponentType<SVGProps<SVGSVGElement>>;
};

export function SystemNoticeShell({ title, intro, icon: Icon, details }: Readonly<{
  title: string;
  intro: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  details: ReadonlyArray<SystemNoticeDetail>;
}>) {
  return (
    <article className="w-full max-w-2xl rounded-xl border border-admin-border bg-admin-surface p-4 shadow-sm">
      <div className="mb-4 flex items-start gap-2 border-b border-admin-border pb-3">
        <Icon aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-admin-accent" />
        <div><p className="text-sm font-bold text-admin-ink">{title}</p><p className="mt-0.5 text-xs text-admin-muted">{intro}</p></div>
      </div>
      <dl className="grid gap-2.5 sm:grid-cols-2">
        {details.map(({ label, value, icon: DetailIcon }) => (
          <div className="min-w-0 rounded-lg bg-admin-canvas px-3 py-2" key={`${label}:${value}`}>
            <dt className="flex items-center gap-1.5 text-[0.68rem] font-medium text-admin-muted"><DetailIcon aria-hidden="true" className="size-3.5 shrink-0" />{label}</dt>
            <dd className="mt-1 break-words text-xs font-semibold text-admin-ink">{value}</dd>
          </div>
        ))}
      </dl>
    </article>
  );
}
