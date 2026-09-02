"use client";

import { useTranslations } from "next-intl";
import {
  BanknotesIcon,
  BellAlertIcon,
  CalendarDaysIcon,
  ChatBubbleLeftEllipsisIcon,
  ClockIcon,
  UserPlusIcon,
} from "@heroicons/react/24/outline";
import { Button, Card } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useMemo } from "react";

import { useAdminBranch, useAdminDashboard } from "@/service";
import { buildActivityItems } from "./adapters";

const quickActions = [
  { id: "appointment", labelKey: "quick.appointment", icon: CalendarDaysIcon, href: "/admin/appointments?create=1" },
  { id: "payment", labelKey: "quick.payment", icon: BanknotesIcon, href: "/admin/payments" },
  { id: "customer", labelKey: "quick.customer", icon: UserPlusIcon, href: "/admin/customers" },
  { id: "message", labelKey: "quick.message", icon: ChatBubbleLeftEllipsisIcon, href: "/admin/messages" },
] as const;

const notificationIcons = {
  appointment: BellAlertIcon,
  revenue: BanknotesIcon,
  reminder: ClockIcon,
} as const;

export function UtilityPanel() {
  const t = useTranslations("admin.dashboard");
  const router = useRouter();
  const { branchId } = useAdminBranch();
  const { data, error, isLoading } = useAdminDashboard(branchId);

  const notifications = useMemo(() => buildActivityItems(data, t), [data, t]);

  return (
    <div className="flex h-full flex-col gap-4 xl:col-span-4">
      <Card className="gap-0 rounded-xl border-admin-border bg-admin-surface p-0 shadow-none">
        <Card.Header className="px-4 pt-4 sm:px-5 sm:pt-5">
          <h2 className="text-sm font-bold text-admin-ink">{t("quick.heading")}</h2>
        </Card.Header>
        <Card.Content className="grid grid-cols-2 gap-2 px-4 pb-4 pt-3 sm:px-5 sm:pb-5">
          {quickActions.map(({ id, labelKey, icon: Icon, ...action }) => {
            const label = t(labelKey);
            return (
            <Button
              key={id}
              variant="outline"
              className="h-auto min-h-16 flex-col gap-1 rounded-lg border-admin-border px-2 py-2 text-xs text-admin-ink"
              aria-label={"href" in action ? label : t("quick.unavailable", { label })}
              isDisabled={!("href" in action)}
              onPress={() => { if ("href" in action) router.push(action.href); }}
            >
              <Icon aria-hidden="true" className="size-6 text-admin-accent" />
              {label}
            </Button>
            );
          })}
        </Card.Content>
      </Card>

      <Card className="flex h-full flex-col gap-0 rounded-xl border-admin-border bg-admin-surface p-0 shadow-none">
        <Card.Header className="flex flex-row items-center justify-between gap-2 px-4 pt-4 sm:px-5 sm:pt-5">
          {/* No notifications screen exists to open, so the header carries no
              "Xem tất cả" — the card already lists everything there is. */}
          <h2 className="text-sm font-bold text-admin-ink">{t("notifications.heading")}</h2>
        </Card.Header>
        <Card.Content className="px-4 pb-4 pt-3 sm:px-5 sm:pb-5">
          {error ? (
            <p role="alert" className="rounded-lg bg-danger/10 px-3 py-3 text-center text-xs text-danger">
              Không tải được thông báo.
            </p>
          ) : !branchId || isLoading ? (
            <p className="py-3 text-center text-xs text-admin-muted">{t("notifications.loading")}</p>
          ) : notifications.length === 0 ? (
            <p className="py-3 text-center text-xs text-admin-muted">{t("notifications.empty")}</p>
          ) : (
          <ul aria-label={t("notifications.listLabel")} className="divide-y divide-admin-border">
            {notifications.map((notification) => {
              const Icon = notificationIcons[notification.kind];

              return (
                <li key={notification.id} className="flex gap-3 py-3">
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-admin-soft text-admin-accent">
                    <Icon aria-hidden="true" className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold leading-5 text-admin-ink">{notification.title}</p>
                    <div className="mt-0.5 flex flex-wrap items-center justify-between gap-x-2 gap-y-1 text-[0.65rem] text-admin-muted">
                      <p>{notification.detail}</p>
                      <time>{notification.time}</time>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
          )}
        </Card.Content>
      </Card>
    </div>
  );
}

export const utilityPanelMeta = { world: "connected", domain: "admin-dashboard" } as const;
