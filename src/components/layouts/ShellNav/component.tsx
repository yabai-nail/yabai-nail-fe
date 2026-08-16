import {
  Bars3Icon,
  MoonIcon,
  SunIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { LoginModal } from "@/components/overlays/auth/LoginModal";
import Link from "next/link";

/** One destination shown in the primary navigation. */
export type ShellNavRoute = {
  readonly id: string;
  readonly href: string;
  readonly label: string;
  readonly isCurrent: boolean;
};

/** Resolved copy and state drawn by the navigation shell. */
export type ShellNavData = {
  readonly brand: string;
  readonly tagline: string;
  readonly routes: ReadonlyArray<ShellNavRoute>;
  readonly bookingHref: string;
  readonly bookingLabel: string;
  readonly isBookingCurrent: boolean;
  readonly isDark: boolean;
  readonly isThemeReady: boolean;
  readonly themeLabel: string;
  readonly isMenuOpen: boolean;
  readonly menuLabel: string;
};

/** Events reported by interactive navigation controls. */
export type ShellNavActions = {
  readonly toggleTheme: () => void;
  readonly toggleMenu: () => void;
  readonly closeMenu: () => void;
};

export type ShellNavProps = {
  readonly props: ShellNavData;
  readonly on: ShellNavActions;
};

const navLinkClassName = (isCurrent: boolean) =>
  [
    "flex min-h-11 items-center rounded-lg px-4 text-sm font-medium",
    "transition-colors focus-visible:outline-none focus-visible:ring-2",
    "focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    isCurrent
      ? "bg-accent-soft text-accent-soft-foreground"
      : "text-muted hover:bg-default hover:text-foreground",
  ].join(" ");

/** Draw the responsive site navigation without owning route or theme state. */
export const _ShellNav = ({ props, on }: ShellNavProps) => (
  <header className="sticky top-0 z-50 border-b border-separator bg-background/90 backdrop-blur-md">
    <div className="mx-auto flex min-h-16 w-full max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
      <Link
        href="/"
        className="flex min-h-11 min-w-0 items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        aria-label={`${props.brand} — Trang chủ`}
      >
        <span
          aria-hidden="true"
          className="font-display grid size-10 shrink-0 place-items-center rounded-full bg-accent text-xl font-semibold text-accent-foreground"
        >
          Y
        </span>
        <span className="min-w-0 leading-none">
          <span className="font-display block truncate text-base font-semibold tracking-[0.18em] text-foreground">
            {props.brand}
          </span>
          <span className="mt-1 block truncate text-xs text-muted">
            {props.tagline}
          </span>
        </span>
      </Link>

      <nav
        aria-label="Điều hướng chính"
        className="ml-auto hidden items-center gap-1 lg:flex"
      >
        {props.routes.map((route) => (
          <Link
            key={route.id}
            href={route.href}
            aria-current={route.isCurrent ? "page" : undefined}
            className={navLinkClassName(route.isCurrent)}
          >
            {route.label}
          </Link>
        ))}
      </nav>

      <div className="ml-auto flex items-center gap-2 lg:ml-3">
        <button
          type="button"
          onClick={on.toggleTheme}
          aria-label={props.themeLabel}
          title={props.themeLabel}
          className="grid size-11 place-items-center rounded-lg text-muted transition-colors hover:bg-default hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          {props.isThemeReady && props.isDark ? (
            <SunIcon aria-hidden="true" className="size-5" />
          ) : (
            <MoonIcon aria-hidden="true" className="size-5" />
          )}
        </button>

        <LoginModal triggerClassName="hidden min-h-11 items-center gap-2 rounded-lg border border-border px-4 text-sm font-semibold text-foreground transition-colors hover:border-accent hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:flex" />

        <Link
          href={props.bookingHref}
          aria-current={props.isBookingCurrent ? "page" : undefined}
          className="hidden min-h-11 items-center rounded-lg bg-accent px-5 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:flex"
        >
          {props.bookingLabel}
        </Link>

        <button
          type="button"
          onClick={on.toggleMenu}
          aria-label={props.menuLabel}
          aria-expanded={props.isMenuOpen}
          aria-controls="shell-nav-mobile-menu"
          className="grid size-11 place-items-center rounded-lg text-foreground transition-colors hover:bg-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-background lg:hidden"
        >
          {props.isMenuOpen ? (
            <XMarkIcon aria-hidden="true" className="size-6" />
          ) : (
            <Bars3Icon aria-hidden="true" className="size-6" />
          )}
        </button>
      </div>
    </div>

    {props.isMenuOpen ? (
      <nav
        id="shell-nav-mobile-menu"
        aria-label="Điều hướng trên thiết bị di động"
        className="border-t border-separator bg-background px-4 py-3 lg:hidden"
      >
        <div className="mx-auto flex max-w-7xl flex-col gap-1">
          {props.routes.map((route) => (
            <Link
              key={route.id}
              href={route.href}
              aria-current={route.isCurrent ? "page" : undefined}
              className={navLinkClassName(route.isCurrent)}
              onNavigate={on.closeMenu}
            >
              {route.label}
            </Link>
          ))}
          <LoginModal
            triggerClassName="mt-2 flex min-h-11 items-center justify-center gap-2 rounded-lg border border-border px-5 text-sm font-semibold text-foreground transition-colors hover:border-accent hover:text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:hidden"
            onDismiss={on.closeMenu}
          />
          <Link
            href={props.bookingHref}
            aria-current={props.isBookingCurrent ? "page" : undefined}
            onNavigate={on.closeMenu}
            className="mt-2 flex min-h-11 items-center justify-center rounded-lg bg-accent px-5 text-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-background sm:hidden"
          >
            {props.bookingLabel}
          </Link>
        </div>
      </nav>
    ) : null}
  </header>
);

/** Source-level tier marker for the pure shell layout. */
export const meta = { world: "pure", domain: "shell" } as const;
