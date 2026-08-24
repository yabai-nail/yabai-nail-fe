import type { Metadata } from "next";
import { AdminReports } from "@/components/pages/admin/AdminReports";

export const metadata: Metadata = { title: "Báo cáo | YABAI Nail Salon", description: "Theo dõi doanh thu, chi nhánh, khách hàng, hiệu suất nhân viên và xuất báo cáo của YABAI Nail Salon." };

export default function AdminReportsPage() { return <AdminReports />; }
