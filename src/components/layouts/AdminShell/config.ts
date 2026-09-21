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
 * Sidebar sections, in the order they render. "overview" is the lone dashboard link and
 * shows no heading; the rest carry a heading from `admin.nav.groups.<group>`. A section is
 * omitted entirely when the role can reach none of its routes.
 */
export type AdminNavGroup = "overview" | "operations" | "catalog" | "finance" | "team" | "system";

export const adminNavGroupOrder: ReadonlyArray<AdminNavGroup> = [
  "overview",
  "operations",
  "catalog",
  "finance",
  "team",
  "system",
];

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
    requiredAnyPermission: ["message.read.assigned", "message.read.branch"],
  },
  {
    id: "payments",
    href: "/admin/payments",
    icon: BanknotesIcon,
    isAvailable: true,
    requiredAnyPermission: ["payment.read.assigned", "payment.read.branch"],
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

// Which section each route sits in. A Record over the id union means adding a route without
// placing it is a compile error, so the sidebar can never silently drop one.
const adminNavGroupById: Record<AdminRoute["id"], AdminNavGroup> = {
  dashboard: "overview",
  appointments: "operations",
  customers: "operations",
  messages: "operations",
  payments: "operations",
  operations: "operations",
  services: "catalog",
  "nail-designs": "catalog",
  marketing: "catalog",
  reviews: "catalog",
  reports: "finance",
  "sales-reports": "finance",
  payroll: "finance",
  report: "finance",
  "my-payroll": "finance",
  staff: "team",
  accounts: "team",
  branches: "system",
  "audit-logs": "system",
  settings: "system",
};

export type AdminNavSection = { readonly group: AdminNavGroup; readonly routes: ReadonlyArray<AdminRoute> };

/** The accessible routes grouped into sidebar sections, in render order; empty sections dropped. */
export function groupAdminRoutes(permissions: ReadonlyArray<string>): ReadonlyArray<AdminNavSection> {
  return adminNavGroupOrder
    .map((group) => ({
      group,
      routes: adminRoutes.filter((route) => adminNavGroupById[route.id] === group && canAccessAdminRoute(route, permissions)),
    }))
    .filter((section) => section.routes.length > 0);
}

export const adminRouteConfigMeta = {
  world: "pure",
  domain: "admin-route-config",
} as const;
