"use client";

export type StaffBranchOption = {
  readonly id: string;
  readonly name: string;
};

/**
 * Which salon a technician works at, as an editable field. Shared by both staff forms: the
 * create form picks the branch they start at, the edit form moves them between branches.
 *
 * The wording comes from the caller because those two are not the same sentence — one files a
 * new hire, the other transfers someone who already has a schedule.
 *
 * It renders nothing unless there is somewhere to choose between and the current value is one
 * of the options. A one-branch salon has no choice to offer, and a manager whose token cannot
 * read `GET /admin/branches` gets an empty list — in both cases a select would either be dead
 * or, worse, preselect the wrong branch and file the technician there on save.
 */
export function StaffBranchField({
  branches,
  value,
  onChange,
  label,
  hint,
  disabled = false,
}: Readonly<{
  branches: ReadonlyArray<StaffBranchOption>;
  value: string;
  onChange: (branchId: string) => void;
  label: string;
  hint: string;
  disabled?: boolean;
}>) {
  if (branches.length <= 1) return null;
  if (!branches.some((branch) => branch.id === value)) return null;

  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-semibold text-admin-ink">{label}</span>
      <select
        className="min-h-10 rounded-lg border border-admin-border bg-admin-surface px-3 text-admin-ink"
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {branches.map((branch) => (
          <option key={branch.id} value={branch.id}>
            {branch.name}
          </option>
        ))}
      </select>
      <span className="text-xs text-admin-muted">{hint}</span>
    </label>
  );
}
