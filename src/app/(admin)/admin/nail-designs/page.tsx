import type { Metadata } from "next";
import { AdminNailDesigns } from "@/components/pages/admin/AdminNailDesigns";

export const metadata: Metadata = { title: "Mẫu nail | YABAI Nail Salon", description: "Quản lý bộ sưu tập mẫu nail và duyệt đề xuất từ khách hàng YABAI Nail Salon." };

export default function AdminNailDesignsPage() { return <AdminNailDesigns />; }
