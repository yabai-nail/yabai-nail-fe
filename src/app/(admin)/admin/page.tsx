import type { Metadata } from "next";
import { AdminDashboard } from "@/components/pages/AdminDashboard";

export const metadata: Metadata = {
  title: "Tổng quan quản trị | YABAI Nail Salon",
  description: "Bảng điều khiển hoạt động cửa hàng YABAI Nail Salon.",
};

export default function AdminPage() {
  return <AdminDashboard />;
}
