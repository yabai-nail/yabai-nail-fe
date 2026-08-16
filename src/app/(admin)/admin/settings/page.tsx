import type { Metadata } from "next";
import { AdminSettings } from "@/components/pages/admin/AdminSettings";

export const metadata: Metadata = { title: "Cài đặt | YABAI Nail Salon", description: "Quản lý thiết lập nhân viên và hoa hồng." };
export default function AdminSettingsPage() { return <AdminSettings />; }
