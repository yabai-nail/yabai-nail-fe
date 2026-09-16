import { Suspense } from "react";
import { AdminPayments } from "@/components/pages/admin/AdminPayments";


export default function AdminPaymentsPage() {
  // useSearchParams() inside AdminPayments needs a boundary or the static
  // prerender bails out at build time.
  return (
    <Suspense>
      <AdminPayments />
    </Suspense>
  );
}
