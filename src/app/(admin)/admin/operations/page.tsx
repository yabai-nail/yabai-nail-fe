import type { Metadata } from "next";
import { AdminOperations } from "@/components/pages/admin/AdminOperations";

export const metadata: Metadata = {
  title: "Vận hành | YABAI Nail Salon",
  description: "Hoàn tiền, duyệt nghỉ phép, check-in, thẻ thành viên và tra cứu khách.",
};

export default function AdminOperationsPage() {
  return <AdminOperations />;
}
