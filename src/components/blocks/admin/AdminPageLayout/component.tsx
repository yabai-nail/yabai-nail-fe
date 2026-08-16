import type { ReactNode } from "react";

type AdminPageLayoutProps = {
  readonly children: ReactNode;
};

export function _AdminPageLayout({ children }: AdminPageLayoutProps) {
  return (
    <main id="main-content" className="px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
      {children}
    </main>
  );
}

export const meta = {
  world: "pure",
  domain: "admin-page-layout",
} as const;
