import type { Metadata } from "next";
import { AdminAppointments } from "@/components/pages/admin/AdminAppointments";

export const metadata: Metadata = {
  title: "Quản lý lịch hẹn | YABAI Nail Salon",
  description: "Xem, sắp xếp và quản lý lịch hẹn của YABAI Nail Salon.",
};

export default async function AdminAppointmentsPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<{ create?: string | string[]; id?: string | string[] }>;
}>) {
  const { create, id } = await searchParams;
  const initialSelectedId = typeof id === "string" ? id : Array.isArray(id) ? id[0] : undefined;
  return <AdminAppointments initialCreate={create === "1"} initialSelectedId={initialSelectedId} />;
}
