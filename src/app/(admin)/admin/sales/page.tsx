import { Suspense } from "react";
import { AdminSales } from "@/components/pages/admin/AdminSales";


export default function AdminSalesPage() {
  // useSearchParams() inside AdminSales (the "?new=1&designs=…" shortcut) needs a boundary or
  // the static prerender bails out at build time.
  return (
    <Suspense>
      <AdminSales />
    </Suspense>
  );
}
