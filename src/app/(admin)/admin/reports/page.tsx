import type { Metadata } from "next";
import { AdminReports } from "@/components/pages/admin/AdminReports";

export const metadata: Metadata = {
  title: "Báo cáo | YABAI Nail Salon",
  description: "Theo dõi doanh thu, khách hàng, nhân viên và xuất báo cáo.",
};

export default function AdminReportsPage() {
  return <AdminReports />;
}
