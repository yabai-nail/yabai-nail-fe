import {
  BanknotesIcon,
  BuildingStorefrontIcon,
  CalendarDaysIcon,
  ChartBarSquareIcon,
  ChatBubbleLeftRightIcon,
  ClipboardDocumentListIcon,
  Cog6ToothIcon,
  HomeIcon,
  MegaphoneIcon,
  PaintBrushIcon,
  ShieldCheckIcon,
  StarIcon,
  SwatchIcon,
  UserGroupIcon,
  UsersIcon,
  WrenchScrewdriverIcon,
} from "@heroicons/react/24/outline";
import type { ComponentType, SVGProps } from "react";

type AdminNavigationIcon = ComponentType<SVGProps<SVGSVGElement>>;

/**
 * Identity and wiring only. The label, page title and description moved to the
 * message catalogue under `admin.nav.<id>`, keyed by the id below: this module
 * declares itself pure, and a pure module cannot call useTranslations().
 */
export type AdminRoute = {
  readonly id:
    | "dashboard"
    | "appointments"
    | "customers"
    | "messages"
    | "payments"
    | "staff"
    | "services"
    | "nail-designs"
    | "reviews"
    | "marketing"
    | "reports"
    | "branches"
    | "accounts"
    | "operations"
    | "audit-logs"
    | "settings";
  readonly href: string;
  readonly icon: AdminNavigationIcon;
  readonly isAvailable: boolean;
};

export const adminRoutes: ReadonlyArray<AdminRoute> = [
  {
    id: "dashboard",
    href: "/admin",
    icon: HomeIcon,
    isAvailable: true,
  },
  {
    id: "appointments",
    href: "/admin/appointments",
    icon: CalendarDaysIcon,
    isAvailable: true,
  },
  {
    id: "customers",
    href: "/admin/customers",
    icon: UsersIcon,
    isAvailable: true,
  },
  {
    id: "messages",
    href: "/admin/messages",
    icon: ChatBubbleLeftRightIcon,
    isAvailable: true,
  },
  {
    id: "payments",
    href: "/admin/payments",
    icon: BanknotesIcon,
    isAvailable: true,
  },
  {
    id: "staff",
    href: "/admin/staff",
    icon: UserGroupIcon,
    isAvailable: true,
  },
  {
    id: "services",
    href: "/admin/services",
    icon: PaintBrushIcon,
    isAvailable: true,
  },
  {
    id: "nail-designs",
    href: "/admin/nail-designs",
    icon: SwatchIcon,
    isAvailable: true,
  },
  {
    id: "reviews",
    href: "/admin/reviews",
    icon: StarIcon,
    isAvailable: true,
  },
  {
    id: "marketing",
    href: "/admin/marketing",
    icon: MegaphoneIcon,
    isAvailable: true,
  },
  {
    id: "reports",
    href: "/admin/reports",
    icon: ChartBarSquareIcon,
    isAvailable: true,
  },
  {
    id: "branches",
    href: "/admin/branches",
    icon: BuildingStorefrontIcon,
    isAvailable: true,
  },
  {
    id: "accounts",
    href: "/admin/accounts",
    icon: ShieldCheckIcon,
    isAvailable: true,
  },
  {
    id: "operations",
    href: "/admin/operations",
    icon: WrenchScrewdriverIcon,
    isAvailable: true,
  },
  {
    id: "audit-logs",
    href: "/admin/audit-logs",
    icon: ClipboardDocumentListIcon,
    isAvailable: true,
  },
  {
    id: "settings",
    href: "/admin/settings",
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
