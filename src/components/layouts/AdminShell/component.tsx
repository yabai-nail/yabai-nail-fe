"use client";

import {
  Bars3Icon,
  ChevronDownIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { Avatar, Drawer, Dropdown } from "@heroui/react";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { BranchSelector } from "@/components/blocks/admin/BranchSelector";
import { useAuth } from "@/service";
import { getAdminRoute } from "./config";
import { AdminBrand, AdminSidebarContent } from "./navigation";

function initialsOf(displayName: string): string {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const last = parts[parts.length - 1];
  return `${parts[0][0] ?? ""}${parts.length > 1 ? (last[0] ?? "") : ""}`.toUpperCase();
}

function OwnerMenu() {
  const { user, logout } = useAuth();
  const t = useTranslations("admin.shell");
  // The gate guarantees a user here, but the shell must not crash if a render
  // slips through during sign-out.
  const displayName = user?.displayName ?? t("fallbackName");
  // t.has() rather than a plain lookup. AdminRole types the role as one of three, but
  // the value comes off an API response: the old map answered undefined for anything
  // else and rendered nothing, while t() on a missing key throws and takes the shell
  // down with it.
  const roleLabel = user && t.has(`roles.${user.role}`) ? t(`roles.${user.role}`) : "";

  return (
    <Dropdown>
      {/* Same border token as the branch selector beside it, so the header's two
          controls read as the same kind of thing. */}
      <Dropdown.Trigger className="flex min-h-11 items-center gap-3 rounded-lg border border-admin-border px-3 text-left outline-none hover:bg-admin-soft focus-visible:ring-2 focus-visible:ring-admin-accent">
        <Avatar size="sm" color="accent">
          <Avatar.Fallback>{initialsOf(displayName)}</Avatar.Fallback>
        </Avatar>
        <span className="hidden leading-tight sm:block">
          <span className="block text-sm font-semibold text-admin-ink">{displayName}</span>
          <span className="mt-0.5 block text-xs text-admin-muted">{roleLabel}</span>
        </span>
        <ChevronDownIcon aria-hidden="true" className="hidden size-4 text-admin-muted sm:block" />
      </Dropdown.Trigger>
      <Dropdown.Popover placement="bottom end" className="admin-shell">
        <Dropdown.Menu
          aria-label={t("accountMenu")}
          onAction={(key) => {
            if (key === "logout") logout();
          }}
        >
          <Dropdown.Item id="settings" textValue={t("accountSettings")}>
            {t("accountSettings")}
          </Dropdown.Item>
          <Dropdown.Item id="logout" textValue={t("signOut")}>
            {t("signOut")}
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}

export function AdminShell({ children }: Readonly<{ children: ReactNode }>) {
  const pathname = usePathname();
  const t = useTranslations("admin.shell");
  const tNav = useTranslations("admin.nav");
  const currentRoute = getAdminRoute(pathname);

  return (
    <div className="admin-shell min-h-screen bg-admin-canvas text-admin-ink">
      <a
        href="#main-content"
        className="fixed left-3 top-3 z-[100] -translate-y-24 rounded-lg bg-admin-accent px-4 py-2 text-sm font-semibold text-white transition-transform focus:translate-y-0"
      >
        Bỏ qua đến nội dung chính
      </a>

      <aside className="fixed inset-y-0 left-0 z-40 hidden w-56 flex-col border-r border-admin-border bg-admin-surface px-4 py-3 lg:flex">
        <AdminBrand />
        <AdminSidebarContent />
      </aside>

      <div className="min-h-screen lg:pl-56">
        <header className="sticky top-0 z-30 border-b border-admin-border bg-admin-surface/95 backdrop-blur">
          <div className="flex min-h-16 items-center gap-3 px-4 sm:px-6 lg:min-h-20 lg:px-8">
            <Drawer>
              <Drawer.Trigger
                aria-label={t("openNav")}
                className="grid size-11 place-items-center rounded-lg text-admin-ink outline-none hover:bg-admin-soft focus-visible:ring-2 focus-visible:ring-admin-accent lg:hidden"
              >
                <Bars3Icon aria-hidden="true" className="size-6" />
              </Drawer.Trigger>
              <Drawer.Backdrop className="admin-shell lg:hidden">
                <Drawer.Content placement="left" className="w-72 max-w-[88vw] lg:hidden">
                  <Drawer.Dialog>
                    <Drawer.Header className="flex flex-row items-center justify-between border-b border-admin-border">
                      <Drawer.Heading className="sr-only">{t("navLabel")}</Drawer.Heading>
                      <AdminBrand />
                      <Drawer.CloseTrigger
                        aria-label={t("closeNav")}
                        className="rounded-lg text-admin-muted"
                      >
                        <XMarkIcon aria-hidden="true" className="size-5" />
                      </Drawer.CloseTrigger>
                    </Drawer.Header>
                    <Drawer.Body className="flex min-h-0 flex-1 px-4 pb-4">
                      <AdminSidebarContent />
                    </Drawer.Body>
                  </Drawer.Dialog>
                </Drawer.Content>
              </Drawer.Backdrop>
            </Drawer>

            <div className="min-w-0 flex-1">
              <h1 className="truncate text-base font-bold text-admin-ink sm:text-lg">
                {tNav(`${currentRoute.id}.title`)}
              </h1>
              <p className="mt-1 hidden text-xs text-admin-muted sm:block">
                {tNav(`${currentRoute.id}.description`)}
              </p>
            </div>

            <BranchSelector />
            <OwnerMenu />
          </div>
        </header>

        {children}
      </div>
    </div>
  );
}

export const adminShellMeta = { world: "connected", domain: "admin-shell" } as const;
