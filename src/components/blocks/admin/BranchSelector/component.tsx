"use client";

import { BuildingStorefrontIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import { Dropdown } from "@heroui/react";

import { useAdminBranch } from "@/service";

// Sits in the admin shell header. Hides itself when there is nothing to
// switch (unauthenticated admin, or admin with a single branch) so the
// header does not carry a dead control.
export function BranchSelector() {
  const { branchId, branchIds, setBranchId } = useAdminBranch();

  if (branchIds.length <= 1) return null;
  if (branchId === null) return null;

  return (
    <Dropdown>
      <Dropdown.Trigger
        aria-label={`Chi nhánh đang xem: ${branchId}. Bấm để đổi.`}
        className="hidden min-h-11 items-center gap-2 rounded-lg border border-admin-border bg-admin-surface px-3 text-left outline-none hover:bg-admin-soft focus-visible:ring-2 focus-visible:ring-admin-accent sm:flex"
      >
        <BuildingStorefrontIcon aria-hidden="true" className="size-4 text-admin-muted" />
        <span className="flex flex-col leading-tight">
          <span className="text-[10px] uppercase tracking-wide text-admin-muted">Chi nhánh</span>
          <span className="text-sm font-semibold text-admin-ink">{branchId}</span>
        </span>
        <ChevronDownIcon aria-hidden="true" className="size-4 text-admin-muted" />
      </Dropdown.Trigger>
      <Dropdown.Popover placement="bottom end" className="admin-shell">
        <Dropdown.Menu
          aria-label="Danh sách chi nhánh"
          selectionMode="single"
          selectedKeys={new Set([branchId])}
          onSelectionChange={(keys) => {
            const next = typeof keys === "string" ? keys : Array.from(keys)[0];
            if (typeof next === "string") setBranchId(next);
          }}
        >
          {branchIds.map((id) => (
            <Dropdown.Item key={id} id={id} textValue={id}>
              {id}
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}
