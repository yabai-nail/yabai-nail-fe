import type { ReactNode } from "react";
import { ShellFooter } from "@/components/layouts/ShellFooter";
import { ShellNav } from "@/components/layouts/ShellNav";

export default function SiteLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="flex min-h-screen flex-col">
      <ShellNav />
      {children}
      <ShellFooter />
    </div>
  );
}
