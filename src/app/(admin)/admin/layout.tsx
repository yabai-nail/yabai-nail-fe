import type { ReactNode } from "react";
import { AdminAuthGate } from "@/components/layouts/AdminAuthGate";
import { AdminShell } from "@/components/layouts/AdminShell";
import { AdminBranchProvider } from "@/service";

export default function AdminLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  // The gate is outermost: no branch context and no shell chrome should exist
  // for a visitor who has not signed in. Inside it, the branch context sits
  // above AdminShell so the header can render the active branch.
  return (
    <AdminAuthGate>
      <AdminBranchProvider>
        <AdminShell>{children}</AdminShell>
      </AdminBranchProvider>
    </AdminAuthGate>
  );
}
