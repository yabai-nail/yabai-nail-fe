import type { Metadata } from "next";
import { AdminServices } from "@/components/pages/AdminServices";

export const metadata: Metadata = { title: "Quản lý dịch vụ | YABAI Nail Salon", description: "Quản lý danh mục và dịch vụ của YABAI Nail Salon." };
export default function AdminServicesPage() { return <AdminServices />; }
