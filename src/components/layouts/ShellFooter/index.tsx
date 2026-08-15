import { _ShellFooter, type ShellFooterLink } from "./component";

const FOOTER_LINKS: ReadonlyArray<ShellFooterLink> = [
  { id: "services", href: "/services", label: "Dịch vụ" },
  { id: "designs", href: "/designs", label: "Bộ sưu tập" },
  { id: "branches", href: "/branches", label: "Chi nhánh" },
  { id: "booking", href: "/booking/services", label: "Đặt lịch" },
];

/** Resolve stable YABAI copy for the global footer. */
export const ShellFooter = () => (
  <_ShellFooter
    props={{
      brand: "YABAI",
      tagline: "Nail atelier · Sài Gòn",
      description:
        "Một khoảng dừng nhẹ nhàng dành cho đôi tay, với dịch vụ chăm sóc và thiết kế móng chỉn chu.",
      navigationLabel: "Khám phá",
      links: FOOTER_LINKS,
      bookingHref: "/booking/services",
      bookingLabel: "Đặt lịch ngay",
      locationLabel: "Ghé YABAI",
      location: "Thảo Điền · Thành phố Hồ Chí Minh",
      copyright: `© ${new Date().getFullYear()} YABAI. All rights reserved.`,
    }}
  />
);

export const meta = { world: "connected", domain: "shell" } as const;
