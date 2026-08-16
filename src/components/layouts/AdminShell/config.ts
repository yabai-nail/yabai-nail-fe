import {
  BanknotesIcon,
  CalendarDaysIcon,
  ChartBarSquareIcon,
  ChatBubbleLeftRightIcon,
  Cog6ToothIcon,
  HomeIcon,
  PaintBrushIcon,
  UserGroupIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import type { ComponentType, SVGProps } from "react";

type AdminNavigationIcon = ComponentType<SVGProps<SVGSVGElement>>;

export type AdminRoute = {
  readonly id:
    | "dashboard"
    | "appointments"
    | "customers"
    | "messages"
    | "payments"
    | "staff"
    | "services"
    | "reports"
    | "settings";
  readonly href: string;
  readonly label: string;
  readonly title: string;
  readonly description: string;
  readonly icon: AdminNavigationIcon;
  readonly badge?: string;
  readonly isAvailable: boolean;
};

export const adminRoutes: ReadonlyArray<AdminRoute> = [
  {
    id: "dashboard",
    href: "/admin",
    label: "Tổng quan",
    title: "Chào buổi sáng, Chủ tiệm! 🌸",
    description: "Hôm nay là Chủ nhật, 16/08/2026",
    icon: HomeIcon,
    isAvailable: true,
  },
  {
    id: "appointments",
    href: "/admin/appointments",
    label: "Lịch hẹn",
    title: "Quản lý lịch hẹn",
    description: "Xem, quản lý và sắp xếp tất cả lịch hẹn của tiệm.",
    icon: CalendarDaysIcon,
    isAvailable: false,
  },
  {
    id: "customers",
    href: "/admin/customers",
    label: "Khách hàng",
    title: "Quản lý khách hàng",
    description: "Quản lý thông tin và lịch sử của khách hàng.",
    icon: UsersIcon,
    isAvailable: true,
  },
  {
    id: "messages",
    href: "/admin/messages",
    label: "Tin nhắn",
    title: "Tin nhắn",
    description: "Quản lý tin nhắn từ khách hàng.",
    icon: ChatBubbleLeftRightIcon,
    badge: "18",
    isAvailable: true,
  },
  {
    id: "payments",
    href: "/admin/payments",
    label: "Thanh toán",
    title: "Quản lý thanh toán",
    description: "Theo dõi giao dịch và doanh thu của tiệm.",
    icon: BanknotesIcon,
    isAvailable: false,
  },
  {
    id: "staff",
    href: "/admin/staff",
    label: "Nhân viên",
    title: "Quản lý nhân viên",
    description: "Quản lý thông tin và doanh thu của nhân viên.",
    icon: UserGroupIcon,
    isAvailable: true,
  },
  {
    id: "services",
    href: "/admin/services",
    label: "Dịch vụ",
    title: "Quản lý dịch vụ",
    description: "Thêm, chỉnh sửa và quản lý các dịch vụ của tiệm.",
    icon: PaintBrushIcon,
    isAvailable: true,
  },
  {
    id: "reports",
    href: "/admin/reports",
    label: "Báo cáo",
    title: "Báo cáo",
    description: "Theo dõi hiệu quả hoạt động của tiệm.",
    icon: ChartBarSquareIcon,
    isAvailable: false,
  },
  {
    id: "settings",
    href: "/admin/settings",
    label: "Cài đặt",
    title: "Cài đặt",
    description: "Quản lý và thiết lập cho tiệm nail của bạn.",
    icon: Cog6ToothIcon,
    isAvailable: true,
  },
] as const;

const dashboardRoute = adminRoutes[0];

export function getAdminRoute(pathname: string): AdminRoute {
  const exactRoute = adminRoutes.find((route) => route.href === pathname);

  if (exactRoute) {
    return exactRoute;
  }

  return (
    adminRoutes.find(
      (route) =>
        route.href !== dashboardRoute.href &&
        pathname.startsWith(`${route.href}/`),
    ) ?? dashboardRoute
  );
}

export const adminRouteConfigMeta = {
  world: "pure",
  domain: "admin-route-config",
} as const;
