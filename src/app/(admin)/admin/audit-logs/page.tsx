import type { Metadata } from "next";
import { AdminAuditLogs } from "@/components/pages/admin/AdminAuditLogs";

export const metadata: Metadata = {
  title: "Nhật ký hệ thống | YABAI Nail Salon",
  description: "Theo dõi nhật ký thao tác quản trị của YABAI Nail Salon.",
};

export default function AdminAuditLogsPage() {
  return <AdminAuditLogs />;
}
