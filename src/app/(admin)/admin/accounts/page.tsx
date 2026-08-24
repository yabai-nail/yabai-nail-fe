import type { Metadata } from "next";
import { AdminAccounts } from "@/components/pages/admin/AdminAccounts";

export const metadata: Metadata = {
  title: "Tài khoản & Cấu hình | YABAI Nail Salon",
  description: "Quản lý tài khoản quản trị và cấu hình hệ thống, loyalty.",
};

export default function AdminAccountsPage() {
  return <AdminAccounts />;
}
