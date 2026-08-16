import type { Metadata } from "next";
import { AdminAppointments } from "@/components/pages/admin/AdminAppointments";

export const metadata: Metadata = {
  title: "Quản lý lịch hẹn | YABAI Nail Salon",
  description: "Xem, sắp xếp và quản lý lịch hẹn của YABAI Nail Salon.",
};

export default async function AdminAppointmentsPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<{ create?: string | string[] }>;
}>) {
  const { create } = await searchParams;
  return <AdminAppointments initialCreate={create === "1"} />;
}
