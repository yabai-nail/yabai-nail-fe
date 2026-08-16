import type { Metadata } from "next";
import { AdminCustomers } from "@/components/pages/AdminCustomers";

export const metadata: Metadata = {
  title: "Quản lý khách hàng | YABAI Nail Salon",
  description: "Quản lý thông tin và lịch sử khách hàng của YABAI Nail Salon.",
};

export default function AdminCustomersPage() {
  return <AdminCustomers />;
}
