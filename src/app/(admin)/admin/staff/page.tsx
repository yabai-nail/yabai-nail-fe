import { AdminStaff } from "@/components/pages/admin/AdminStaff";

export default async function AdminStaffPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<{ branchId?: string | string[]; id?: string | string[] }>;
}>) {
  const { branchId, id } = await searchParams;
  const initialBranchId = typeof branchId === "string" ? branchId : Array.isArray(branchId) ? branchId[0] : undefined;
  const initialSelectedId = typeof id === "string" ? id : Array.isArray(id) ? id[0] : undefined;
  return <AdminStaff key={`${initialBranchId ?? ""}-${initialSelectedId ?? ""}`} initialBranchId={initialBranchId} initialSelectedId={initialSelectedId} />;
}
