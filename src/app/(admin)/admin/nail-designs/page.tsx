import type { Metadata } from "next";
import { AdminNailDesigns } from "@/components/pages/admin/AdminNailDesigns";

export const metadata: Metadata = {
  title: "Mẫu nail | YABAI Nail Salon",
  description: "Quản lý thư viện mẫu nail và duyệt đề xuất.",
};

export default function AdminNailDesignsPage() {
  return <AdminNailDesigns />;
}
