"use client";

import { useTranslations } from "next-intl";

export type StaffBranchOption = {
  readonly id: string;
  readonly name: string;
};

/**
 * Which salon a technician works at, as an editable field.
 *
 * It renders nothing unless there is somewhere to move to and the member's current branch is
 * one of the options. A one-branch salon has no transfer to offer, and a manager whose token
 * cannot read `GET /admin/branches` gets an empty list — in both cases a select would either
 * be dead or, worse, preselect the wrong branch and move the technician on the next save.
 */
export function StaffBranchField({
  branches,
  value,
  onChange,
  disabled = false,
}: Readonly<{
  branches: ReadonlyArray<StaffBranchOption>;
  value: string;
  onChange: (branchId: string) => void;
  disabled?: boolean;
}>) {
  const t = useTranslations("admin.staff.edit");

  if (branches.length <= 1) return null;
  if (!branches.some((branch) => branch.id === value)) return null;

  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-semibold text-admin-ink">{t("branch")}</span>
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
      <span className="text-xs text-admin-muted">{t("branchHint")}</span>
    </label>
  );
}
