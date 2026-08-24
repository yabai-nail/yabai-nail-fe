import type { Metadata } from "next";

import { AdminSystem } from "@/components/pages/admin/AdminSystem";

export const metadata: Metadata = {
  title: "Quản trị hệ thống | YABAI Nail Salon",
  description:
    "Cấu hình hệ thống, cấu hình tích điểm, quản lý tài khoản quản trị và nhật ký hệ thống của YABAI Nail Salon.",
};

export default function AdminSystemPage() {
  return <AdminSystem />;
}
