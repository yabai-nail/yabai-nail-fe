import Link from "next/link";

export type ShellFooterLink = {
  readonly id: string;
  readonly href: string;
  readonly label: string;
};

export type ShellFooterData = {
  readonly brand: string;
  readonly tagline: string;
  readonly description: string;
  readonly navigationLabel: string;
  readonly links: ReadonlyArray<ShellFooterLink>;
  readonly bookingHref: string;
  readonly bookingLabel: string;
  readonly locationLabel: string;
  readonly location: string;
  readonly copyright: string;
};

export type ShellFooterProps = {
  readonly props: ShellFooterData;
};

const footerLinkClassName =
  "flex min-h-11 items-center rounded-md text-sm text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-background";

/** Draw the global footer without owning application or browser state. */
export const _ShellFooter = ({ props }: ShellFooterProps) => (
  <footer className="mt-auto border-t border-separator bg-surface">
    <div className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr] lg:px-8">
      <div className="max-w-md">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          aria-label={`${props.brand} — Trang chủ`}
        >
          <span
            aria-hidden="true"
            className="grid size-10 place-items-center rounded-full bg-accent text-lg font-bold text-accent-foreground"
          >
            Y
          </span>
          <span>
            <span className="block text-sm font-bold tracking-[0.2em] text-foreground">
              {props.brand}
            </span>
            <span className="mt-1 block text-xs text-muted">
              {props.tagline}
            </span>
          </span>
        </Link>
        <p className="mt-4 text-sm leading-6 text-muted">
          {props.description}
        </p>
      </div>

      <nav aria-label={props.navigationLabel}>
        <h2 className="text-sm font-semibold text-foreground">
          {props.navigationLabel}
        </h2>
        <ul className="mt-3 grid grid-cols-2 gap-x-4 md:grid-cols-1">
          {props.links.map((link) => (
            <li key={link.id}>
              <Link href={link.href} className={footerLinkClassName}>
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div>
        <h2 className="text-sm font-semibold text-foreground">
          {props.locationLabel}
        </h2>
        <p className="mt-4 text-sm leading-6 text-muted">{props.location}</p>
        <Link
          href={props.bookingHref}
          className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-accent px-5 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          {props.bookingLabel}
        </Link>
      </div>
    </div>

    <div className="border-t border-separator">
      <div className="mx-auto flex min-h-14 w-full max-w-7xl items-center px-4 text-xs text-muted sm:px-6 lg:px-8">
        <p>{props.copyright}</p>
      </div>
    </div>
  </footer>
);

export const meta = { world: "pure", domain: "shell" } as const;
