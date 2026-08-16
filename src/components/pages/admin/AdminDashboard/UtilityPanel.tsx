"use client";

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
import { notifications } from "./data";

const quickActions = [
  { id: "appointment", label: "Tạo lịch hẹn", icon: CalendarDaysIcon, href: "/admin/appointments?create=1" },
  { id: "payment", label: "Thanh toán", icon: BanknotesIcon, href: "/admin/payments" },
  { id: "customer", label: "Thêm khách", icon: UserPlusIcon, href: "/admin/customers" },
  { id: "message", label: "Gửi tin nhắn", icon: ChatBubbleLeftEllipsisIcon, href: "/admin/messages" },
] as const;

const notificationIcons = {
  appointment: BellAlertIcon,
  revenue: BanknotesIcon,
  reminder: ClockIcon,
} as const;

export function UtilityPanel() {
  const router = useRouter();

  return (
    <div className="space-y-4 xl:col-span-3">
      <Card className="gap-0 rounded-xl border-admin-border bg-admin-surface p-0 shadow-none">
        <Card.Header className="px-4 pt-4">
          <h2 className="text-sm font-bold text-admin-ink">Thao tác nhanh</h2>
        </Card.Header>
        <Card.Content className="grid grid-cols-2 gap-2 px-4 pb-4 pt-3">
          {quickActions.map(({ id, label, icon: Icon, ...action }) => (
            <Button
              key={id}
              variant="outline"
              className="h-auto min-h-16 flex-col gap-1 rounded-lg border-admin-border px-2 py-2 text-xs text-admin-ink"
              aria-label={"href" in action ? label : `${label}, chức năng chưa khả dụng`}
              isDisabled={!("href" in action)}
              onPress={() => { if ("href" in action) router.push(action.href); }}
            >
              <Icon aria-hidden="true" className="size-6 text-admin-accent" />
              {label}
            </Button>
          ))}
        </Card.Content>
      </Card>

      <Card className="gap-0 rounded-xl border-admin-border bg-admin-surface p-0 shadow-none">
        <Card.Header className="flex items-center justify-between gap-2 px-4 pt-4">
          <h2 className="text-sm font-bold text-admin-ink">Thông báo</h2>
          <Button size="sm" variant="ghost" className="rounded-lg text-xs text-admin-accent">
            Xem tất cả
          </Button>
        </Card.Header>
        <Card.Content className="px-4 pb-4 pt-2">
          <ul aria-label="Thông báo mới" className="divide-y divide-admin-border">
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
        </Card.Content>
      </Card>
    </div>
  );
}

export const utilityPanelMeta = { world: "pure", domain: "admin-dashboard" } as const;
