"use client";

import { useCallback, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { CustomerLoginDialog } from "@/components/overlays/auth/CustomerLoginDialog";
import { useCustomerAuth } from "@/service";
import {
  _ShellNav,
  type ShellNavAccount,
  type ShellNavRoute,
} from "./component";

const ROUTES = [
  { id: "home", href: "/", label: "Trang chủ" },
  { id: "services", href: "/services", label: "Dịch vụ" },
  { id: "designs", href: "/designs", label: "Bộ sưu tập" },
  { id: "branches", href: "/branches", label: "Chi nhánh" },
] as const;

const BOOKING_HREF = "/booking/services";

const subscribeToHydration = () => () => undefined;
const getClientHydrationSnapshot = () => true;
const getServerHydrationSnapshot = () => false;

/** Keep a parent navigation item active while visiting one of its nested routes. */
const isCurrentPath = (pathname: string, href: string) =>
  href === "/"
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);

/** Resolve browser-owned navigation and theme state for the pure shell. */
export const ShellNav = () => {
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const { customer, status, logout } = useCustomerAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const isThemeReady = useSyncExternalStore(
    subscribeToHydration,
    getClientHydrationSnapshot,
    getServerHydrationSnapshot,
  );

  const isDark = isThemeReady && resolvedTheme === "dark";
  const routes: ReadonlyArray<ShellNavRoute> = ROUTES.map((route) => ({
    ...route,
    isCurrent: isCurrentPath(pathname, route.href),
  }));

  const toggleTheme = useCallback(() => {
    setTheme(isDark ? "light" : "dark");
  }, [isDark, setTheme]);

  const toggleMenu = useCallback(() => {
    setIsMenuOpen((current) => !current);
  }, []);

  const closeMenu = useCallback(() => {
    setIsMenuOpen(false);
  }, []);

  const openLogin = useCallback(() => {
    setIsLoginOpen(true);
  }, []);

  const signOut = useCallback(() => {
    setIsSigningOut(true);
    // `logout` revokes server-side then clears the local store; it resolves
    // even when the revoke fails, so the flag always comes back down.
    void logout().finally(() => setIsSigningOut(false));
  }, [logout]);

  // The nav renders on the server too, where `status` is always `restoring`;
  // keeping that its own case means no sign-in button is painted before the
  // stored refresh token has had its chance.
  const account: ShellNavAccount =
    status === "authenticated"
      ? {
          status: "authenticated",
          label: customer?.displayName?.trim() || customer?.phone || "Tài khoản",
          phone: customer?.phone ?? "",
          isSigningOut,
        }
      : { status: status === "anonymous" ? "anonymous" : "restoring" };

  return (
    <>
      <_ShellNav
        props={{
          brand: "YABAI",
          tagline: "Nail atelier · Sài Gòn",
          routes,
          bookingHref: BOOKING_HREF,
          bookingLabel: "Đặt lịch",
          isBookingCurrent: isCurrentPath(pathname, "/booking"),
          isDark,
          isThemeReady,
          themeLabel: isDark
            ? "Chuyển sang giao diện sáng"
            : "Chuyển sang giao diện tối",
          isMenuOpen,
          menuLabel: isMenuOpen ? "Đóng menu" : "Mở menu",
          account,
        }}
        on={{ toggleTheme, toggleMenu, closeMenu, openLogin, signOut }}
      />
      <CustomerLoginDialog isOpen={isLoginOpen} onOpenChange={setIsLoginOpen} />
    </>
  );
};

/** Source-level tier marker for the connected shell layout. */
export const meta = { world: "connected", domain: "shell" } as const;
