import type { Metadata } from "next";
import { AdminReviews } from "@/components/pages/admin/AdminReviews";

export const metadata: Metadata = { title: "Đánh giá | YABAI Nail Salon", description: "Trả lời và xử lý đánh giá của khách hàng YABAI Nail Salon." };

export default function AdminReviewsPage() { return <AdminReviews />; }
