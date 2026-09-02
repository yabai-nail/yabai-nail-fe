import {
  ArrowLeftStartOnRectangleIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { Button, ScrollShadow } from "@heroui/react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/service";
import { adminRoutes } from "./config";

export function AdminBrand() {
  const t = useTranslations("admin.shell");

  return (
    <Link
      href="/admin"
      aria-label={t("brand")}
      className="flex min-h-16 items-center gap-3 rounded-lg px-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-accent"
    >
      <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-admin-accent/25 bg-admin-soft text-admin-accent">
        <SparklesIcon aria-hidden="true" className="size-6" />
      </span>
      <span className="leading-none">
        <span className="block text-lg font-extrabold tracking-[0.08em] text-admin-accent">
          YABAINAIL
        </span>
        <span className="mt-1 block text-[0.65rem] font-semibold tracking-[0.18em] text-admin-muted">
          NAIL SALON
        </span>
      </span>
    </Link>
  );
}

export function AdminSidebarContent() {
  const pathname = usePathname();
  const t = useTranslations("admin.shell");
  // Route labels are keyed by the route id, which is all config.ts carries now.
  const tNav = useTranslations("admin.nav");
  // The sidebar's own sign-out was a button with no handler; the only working
  // way out was the avatar menu in the header.
  const { logout } = useAuth();

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ScrollShadow className="min-h-0 flex-1 py-5" hideScrollBar>
        <nav aria-label={t("navLabel")}>
          <ul className="space-y-1">
            {adminRoutes.map(({ id, href, icon: Icon, isAvailable }) => {
              const label = tNav(`${id}.label`);
              const isCurrent =
                pathname === href ||
                (href !== "/admin" && pathname.startsWith(`${href}/`));

              return (
                <li key={href}>
                  {isAvailable ? (
                    <Link
                      href={href}
                      aria-current={isCurrent ? "page" : undefined}
                      className={`flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm outline-none ring-admin-accent focus-visible:ring-2 ${
                        isCurrent
                          ? "bg-admin-soft font-semibold text-admin-accent"
                          : "font-medium text-admin-muted hover:bg-admin-soft hover:text-admin-ink"
                      }`}
                    >
                      <Icon aria-hidden="true" className="size-5" />
                      <span>{label}</span>
                    </Link>
                  ) : (
                    <span
                      aria-disabled="true"
                      title={t("comingSoon")}
                      className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium text-admin-muted"
                    >
                      <Icon aria-hidden="true" className="size-5" />
                      <span>{label}</span>
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>
      </ScrollShadow>

      <Button
        variant="outline"
        fullWidth
        className="mb-1 justify-start rounded-lg border-admin-accent/25 text-admin-accent"
        onPress={logout}
      >
        <ArrowLeftStartOnRectangleIcon aria-hidden="true" className="size-5" />
        {t("signOut")}
      </Button>
    </div>
  );
}

export const adminNavigationMeta = {
  world: "pure",
  domain: "admin-navigation",
} as const;
