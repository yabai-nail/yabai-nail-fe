import type { Metadata } from "next";
import { AdminStaff } from "@/components/pages/AdminStaff";

export const metadata: Metadata = { title: "Quản lý nhân viên | YABAI Nail Salon", description: "Quản lý thông tin và doanh thu của nhân viên." };
export default function AdminStaffPage() { return <AdminStaff />; }
