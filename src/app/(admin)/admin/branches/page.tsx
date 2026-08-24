import type { Metadata } from "next";
import { AdminBranches } from "@/components/pages/admin/AdminBranches";

export const metadata: Metadata = {
  title: "Chi nhánh | YABAI Nail Salon",
  description: "Quản lý danh sách chi nhánh của YABAI Nail Salon.",
};

export default function AdminBranchesPage() {
  return <AdminBranches />;
}
