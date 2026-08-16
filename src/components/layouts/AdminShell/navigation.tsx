import {
  ArrowLeftStartOnRectangleIcon,
  BanknotesIcon,
  CalendarDaysIcon,
  ChartBarSquareIcon,
  ChatBubbleLeftRightIcon,
  Cog6ToothIcon,
  HomeIcon,
  PaintBrushIcon,
  SparklesIcon,
  UserGroupIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import { Button, ScrollShadow } from "@heroui/react";
import Link from "next/link";

type AdminNavigationItem = {
  readonly label: string;
  readonly icon: typeof HomeIcon;
  readonly isCurrent?: boolean;
  readonly badge?: string;
};

const navigation: ReadonlyArray<AdminNavigationItem> = [
  { label: "Tổng quan", icon: HomeIcon, isCurrent: true },
  { label: "Lịch hẹn", icon: CalendarDaysIcon },
  { label: "Khách hàng", icon: UsersIcon },
  { label: "Tin nhắn", icon: ChatBubbleLeftRightIcon, badge: "18" },
  { label: "Thanh toán", icon: BanknotesIcon },
  { label: "Nhân viên", icon: UserGroupIcon },
  { label: "Dịch vụ", icon: PaintBrushIcon },
  { label: "Báo cáo", icon: ChartBarSquareIcon },
  { label: "Cài đặt", icon: Cog6ToothIcon },
];

export function AdminBrand() {
  return (
    <Link
      href="/admin"
      aria-label="YABAI Nail Salon — Tổng quan quản trị"
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
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ScrollShadow className="min-h-0 flex-1 py-5" hideScrollBar>
        <nav aria-label="Điều hướng quản trị">
          <ul className="space-y-1">
            {navigation.map(({ label, icon: Icon, isCurrent, badge }) => (
              <li key={label}>
                {isCurrent ? (
                  <Link
                    href="/admin"
                    aria-current="page"
                    className="flex min-h-11 items-center gap-3 rounded-lg bg-admin-soft px-3 text-sm font-semibold text-admin-accent outline-none ring-admin-accent focus-visible:ring-2"
                  >
                    <Icon aria-hidden="true" className="size-5" />
                    <span>{label}</span>
                  </Link>
                ) : (
                  <span
                    aria-disabled="true"
                    title="Tính năng sẽ được phát triển sau"
                    className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium text-admin-muted"
                  >
                    <Icon aria-hidden="true" className="size-5" />
                    <span>{label}</span>
                    {badge ? (
                      <span className="ml-auto rounded-full bg-admin-accent px-2 py-0.5 text-xs font-bold text-white">
                        {badge}
                      </span>
                    ) : null}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </nav>
      </ScrollShadow>

      <Button
        variant="outline"
        fullWidth
        className="mb-1 justify-start rounded-lg border-admin-accent/25 text-admin-accent"
      >
        <ArrowLeftStartOnRectangleIcon aria-hidden="true" className="size-5" />
        Đăng xuất
      </Button>
    </div>
  );
}

export const adminNavigationMeta = {
  world: "pure",
  domain: "admin-navigation",
} as const;
