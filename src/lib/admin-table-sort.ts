/** The column an admin table is sorted by, and which way; `null` elsewhere means the API's order. */
export type AdminTableSort<K extends string> = { readonly key: K; readonly direction: "asc" | "desc" };

/** What a click on a column header does: ascending → descending → back to the API's order. */
export function nextAdminTableSort<K extends string>(current: AdminTableSort<K> | null, key: K): AdminTableSort<K> | null {
  if (current?.key !== key) return { key, direction: "asc" };
  return current.direction === "asc" ? { key, direction: "desc" } : null;
}
