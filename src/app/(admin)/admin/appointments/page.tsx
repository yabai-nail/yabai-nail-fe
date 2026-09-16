import { AdminAppointments } from "@/components/pages/admin/AdminAppointments";


export default async function AdminAppointmentsPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<{ create?: string | string[]; id?: string | string[] }>;
}>) {
  const { create, id } = await searchParams;
  const initialSelectedId = typeof id === "string" ? id : Array.isArray(id) ? id[0] : undefined;
  return <AdminAppointments initialCreate={create === "1"} initialSelectedId={initialSelectedId} />;
}
