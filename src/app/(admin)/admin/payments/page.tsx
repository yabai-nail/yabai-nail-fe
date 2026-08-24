import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminPayments } from "@/components/pages/admin/AdminPayments";

export const metadata: Metadata = {
  title: "Thanh toán tại quán | YABAI Nail Salon",
  description: "Kiểm tra dịch vụ và xác nhận thanh toán tại YABAI Nail Salon.",
};

export default function AdminPaymentsPage() {
  // useSearchParams() inside AdminPayments needs a boundary or the static
  // prerender bails out at build time.
  return (
    <Suspense>
      <AdminPayments />
    </Suspense>
  );
}
