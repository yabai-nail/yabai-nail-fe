"use client";

import type { ReactNode } from "react";

import { AdminLogin } from "@/components/pages/admin/AdminLogin";
import { useAuth } from "@/service";

/**
 * Nothing under `/admin` renders until an admin session exists. The gate
 * swaps the whole shell for the sign-in form rather than redirecting, so a
 * session that expires on `/admin/payments` comes back to `/admin/payments`.
 */
export function AdminAuthGate({ children }: Readonly<{ children: ReactNode }>) {
  const { status } = useAuth();

  if (status === "restoring") {
    return (
      <div
        role="status"
        aria-live="polite"
        className="admin-shell grid min-h-screen place-items-center bg-admin-canvas text-sm text-admin-muted"
      >
        Đang khôi phục phiên đăng nhập…
      </div>
    );
  }

  if (status === "anonymous") return <AdminLogin />;

  return <>{children}</>;
}

export const adminAuthGateMeta = { world: "connected", domain: "admin-shell" } as const;
