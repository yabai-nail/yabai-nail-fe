import type { Metadata } from "next";

import { AdminCampaigns } from "@/components/pages/admin/AdminCampaigns";

export const metadata: Metadata = {
  title: "Chiến dịch thông báo | YABAI Nail Salon",
  description: "Tạo chiến dịch gửi thông báo, xem trước tập khách và theo dõi chỉ số của YABAI Nail Salon.",
};

export default function AdminCampaignsPage() {
  return <AdminCampaigns />;
}
