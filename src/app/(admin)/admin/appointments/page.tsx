import type { Metadata } from "next";
import { AdminAppointments } from "@/components/pages/AdminAppointments";

export const metadata: Metadata = {
  title: "Quản lý lịch hẹn | YABAI Nail Salon",
  description: "Xem, sắp xếp và quản lý lịch hẹn của YABAI Nail Salon.",
};

export default function AdminAppointmentsPage() {
  return <AdminAppointments />;
}
