import {
  BanknotesIcon,
  BuildingStorefrontIcon,
  CalendarDaysIcon,
  ChartBarSquareIcon,
  ChatBubbleLeftRightIcon,
  ClipboardDocumentCheckIcon,
  ClipboardDocumentListIcon,
  Cog6ToothIcon,
  CurrencyYenIcon,
  HomeIcon,
  MegaphoneIcon,
  PaintBrushIcon,
  ReceiptPercentIcon,
  ShieldCheckIcon,
  StarIcon,
  SwatchIcon,
  UserGroupIcon,
  UsersIcon,
  WalletIcon,
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
    | "sales-reports"
    | "payroll"
    | "report"
    | "my-payroll"
    | "settings";
  readonly href: string;
  readonly icon: AdminNavigationIcon;
  readonly isAvailable: boolean;
  readonly requiredAnyPermission: ReadonlyArray<string>;
};

export const adminRoutes: ReadonlyArray<AdminRoute> = [
  {
    id: "dashboard",
    href: "/admin",
    icon: HomeIcon,
    isAvailable: true,
    requiredAnyPermission: ["report.branch.read.branch", "report.revenue.read.all"],
  },
  {
    id: "appointments",
    href: "/admin/appointments",
    icon: CalendarDaysIcon,
    isAvailable: true,
    requiredAnyPermission: ["appointment.read.assigned", "appointment.read.branch"],
  },
  {
    id: "customers",
    href: "/admin/customers",
    icon: UsersIcon,
    isAvailable: true,
    requiredAnyPermission: ["customer.read.assigned", "customer.read.branch"],
  },
  {
    id: "messages",
    href: "/admin/messages",
    icon: ChatBubbleLeftRightIcon,
    isAvailable: true,
    requiredAnyPermission: ["message.read.branch"],
  },
  {
    id: "payments",
    href: "/admin/payments",
    icon: BanknotesIcon,
    isAvailable: true,
    requiredAnyPermission: ["payment.read.branch"],
  },
  {
    id: "staff",
    href: "/admin/staff",
    icon: UserGroupIcon,
    isAvailable: true,
    requiredAnyPermission: ["staff.read.own", "staff.read.branch"],
  },
  {
    id: "services",
    href: "/admin/services",
    icon: PaintBrushIcon,
    isAvailable: true,
    requiredAnyPermission: ["catalog.read.branch"],
  },
  {
    id: "nail-designs",
    href: "/admin/nail-designs",
    icon: SwatchIcon,
    isAvailable: true,
    requiredAnyPermission: ["design.propose.branch", "design.manage.all"],
  },
  {
    id: "reviews",
    href: "/admin/reviews",
    icon: StarIcon,
    isAvailable: true,
    requiredAnyPermission: ["review.read.branch"],
  },
  {
    id: "marketing",
    href: "/admin/marketing",
    icon: MegaphoneIcon,
    isAvailable: true,
    requiredAnyPermission: ["promotion.read.all", "campaign.send.all"],
  },
  {
    id: "reports",
    href: "/admin/reports",
    icon: ChartBarSquareIcon,
    isAvailable: true,
    requiredAnyPermission: [
      "report.revenue.read.all",
      "report.customer.read.all",
      "report.staff.read.all",
      "report.export.all",
    ],
  },
  {
    id: "sales-reports",
    href: "/admin/sales-reports",
    icon: ReceiptPercentIcon,
    isAvailable: true,
    requiredAnyPermission: ["sales.report.read.branch", "sales.report.approve.branch"],
  },
  {
    id: "payroll",
    href: "/admin/payroll",
    icon: CurrencyYenIcon,
    isAvailable: true,
    requiredAnyPermission: ["payroll.read.branch"],
  },
  {
    id: "report",
    href: "/admin/report",
    icon: ClipboardDocumentCheckIcon,
    isAvailable: true,
    requiredAnyPermission: ["sales.report.write.own"],
  },
  {
    id: "my-payroll",
    href: "/admin/my-payroll",
    icon: WalletIcon,
    isAvailable: true,
    requiredAnyPermission: ["payroll.read.own"],
  },
  {
    id: "branches",
    href: "/admin/branches",
    icon: BuildingStorefrontIcon,
    isAvailable: true,
    requiredAnyPermission: ["branch.read.branch", "branch.read.all"],
  },
  {
    id: "accounts",
    href: "/admin/accounts",
    icon: ShieldCheckIcon,
    isAvailable: true,
    requiredAnyPermission: ["account.read.all"],
  },
  {
    id: "operations",
    href: "/admin/operations",
    icon: WrenchScrewdriverIcon,
    isAvailable: true,
    requiredAnyPermission: ["appointment.queue.read.branch", "refund.create.branch"],
  },
  {
    id: "audit-logs",
    href: "/admin/audit-logs",
    icon: ClipboardDocumentListIcon,
    isAvailable: true,
    requiredAnyPermission: ["audit.read.all"],
  },
  {
    id: "settings",
    href: "/admin/settings",
    icon: Cog6ToothIcon,
    isAvailable: true,
    requiredAnyPermission: ["branch.settings.read.branch", "profile.update.own"],
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

export function canAccessAdminRoute(
  route: AdminRoute,
  permissions: ReadonlyArray<string>,
): boolean {
  return route.isAvailable && route.requiredAnyPermission.some((permission) => permissions.includes(permission));
}

export const adminRouteConfigMeta = {
  world: "pure",
  domain: "admin-route-config",
} as const;
