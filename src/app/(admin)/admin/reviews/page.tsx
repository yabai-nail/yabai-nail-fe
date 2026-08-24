import type { Metadata } from "next";
import { AdminReviews } from "@/components/pages/admin/AdminReviews";

export const metadata: Metadata = {
  title: "Đánh giá | YABAI Nail Salon",
  description: "Quản lý và phản hồi đánh giá của khách hàng.",
};

export default function AdminReviewsPage() {
  return <AdminReviews />;
}
