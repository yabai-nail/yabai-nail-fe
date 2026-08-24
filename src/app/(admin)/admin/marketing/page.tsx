import type { Metadata } from "next";
import { AdminMarketing } from "@/components/pages/admin/AdminMarketing";

export const metadata: Metadata = {
  title: "Marketing | YABAI Nail Salon",
  description: "Quản lý khuyến mãi và chiến dịch thông báo.",
};

export default function AdminMarketingPage() {
  return <AdminMarketing />;
}
