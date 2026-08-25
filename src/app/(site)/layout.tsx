import type { ReactNode } from "react";
import { ShellFooter } from "@/components/layouts/ShellFooter";
import { ShellNav } from "@/components/layouts/ShellNav";
import { CustomerAuthProvider } from "@/service";

export default function SiteLayout({ children }: Readonly<{ children: ReactNode }>) {
  // Customer sessions are scoped to the public site only. Mounting the
  // provider here rather than in the root providers keeps the admin console
  // from booting a customer refresh it will never use.
  return (
    <CustomerAuthProvider>
      <div className="flex min-h-screen flex-col">
        <ShellNav />
        {children}
        <ShellFooter />
      </div>
    </CustomerAuthProvider>
  );
}
