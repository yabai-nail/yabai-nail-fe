import type { ReactNode } from "react";

type AdminSplitLayoutProps = {
  readonly children: ReactNode;
  readonly aside: ReactNode;
  readonly asideWidth?: "sm" | "md";
};

export function _AdminSplitLayout({
  children,
  aside,
  asideWidth = "md",
}: AdminSplitLayoutProps) {
  return (
    <div
      className={`grid min-w-0 items-start gap-4 ${
        asideWidth === "sm" ? "xl:grid-cols-[minmax(0,1fr)_17rem]" : "xl:grid-cols-[minmax(0,1fr)_20rem]"
      }`}
    >
      <div className="min-w-0">{children}</div>
      <aside className="min-w-0">{aside}</aside>
    </div>
  );
}

export const meta = { world: "pure", domain: "admin-split-layout" } as const;
