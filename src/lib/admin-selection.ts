export type SelectableAdminRecord = {
  readonly id: string;
};

export function resolveVisibleSelection<T extends SelectableAdminRecord>(
  visibleRecords: ReadonlyArray<T>,
  selectedId: string,
): T | null {
  return (
    visibleRecords.find((record) => record.id === selectedId) ??
    visibleRecords[0] ??
    null
  );
}
