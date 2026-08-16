import type { Metadata } from "next";
import { AdminMessages } from "@/components/pages/AdminMessages";

export const metadata: Metadata = { title: "Tin nhắn | YABAI Nail Salon", description: "Quản lý tin nhắn khách hàng của YABAI Nail Salon." };

export default function AdminMessagesPage() { return <AdminMessages />; }
