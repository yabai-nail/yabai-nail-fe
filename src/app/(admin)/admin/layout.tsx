import type { ReactNode } from "react";
import { AdminShell } from "@/components/layouts/AdminShell";
import { AdminBranchProvider } from "@/service";

export default function AdminLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  // The branch context sits inside the admin group so it never runs for the
  // public site, but above AdminShell so the shell header can render the
  // active branch alongside the owner menu.
  return (
    <AdminBranchProvider>
      <AdminShell>{children}</AdminShell>
    </AdminBranchProvider>
  );
}
