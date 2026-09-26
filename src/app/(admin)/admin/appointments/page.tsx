import { AdminAppointments } from "@/components/pages/admin/AdminAppointments";


export default async function AdminAppointmentsPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<{ create?: string | string[]; id?: string | string[]; customerId?: string | string[] }>;
}>) {
  const { create, id, customerId } = await searchParams;
  const initialSelectedId = typeof id === "string" ? id : Array.isArray(id) ? id[0] : undefined;
  const initialCustomerId = typeof customerId === "string" ? customerId : Array.isArray(customerId) ? customerId[0] : undefined;
  return <AdminAppointments key={`${create}-${initialCustomerId ?? ""}-${initialSelectedId ?? ""}`} initialCreate={create === "1"} initialSelectedId={initialSelectedId} initialCustomerId={initialCustomerId} />;
}
