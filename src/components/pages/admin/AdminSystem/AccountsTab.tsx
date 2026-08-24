"use client";

import { KeyIcon, PencilSquareIcon, PlusIcon } from "@heroicons/react/24/outline";
import { Button, Card } from "@heroui/react";
import { useMemo, useState } from "react";

import { useAdminAccounts, useAdminBranchList, type AdminAccount } from "@/service";
import { AccountFormModal } from "./AccountFormModal";
import { ResetPasswordDialog } from "./ResetPasswordDialog";
import { SelfPasswordSection } from "./SelfPasswordSection";
import { accountStatusLabel, roleLabel } from "./normalize";

type ModalState =
  | { readonly kind: "create" }
  | { readonly kind: "edit"; readonly account: AdminAccount }
  | { readonly kind: "reset"; readonly account: AdminAccount }
  | null;

export function AccountsTab() {
  const { data, isLoading, error, mutate } = useAdminAccounts();
  const branchList = useAdminBranchList();
  const [modal, setModal] = useState<ModalState>(null);

  const accounts = data?.items ?? [];
  const branches = useMemo(() => branchList.data?.items ?? [], [branchList.data]);
  const branchNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const branch of branches) map.set(branch.id, branch.name);
    return map;
  }, [branches]);

  const branchLabels = (ids: ReadonlyArray<string> | undefined): string => {
    if (!ids || ids.length === 0) return "Toàn chuỗi";
    return ids.map((id) => branchNameById.get(id) ?? id).join(", ");
  };

  return (
    <div className="mt-4 flex flex-col gap-6">
      <Card className="overflow-hidden rounded-lg border-admin-border bg-admin-surface shadow-none">
        <Card.Header className="flex items-center justify-between gap-2 border-b border-admin-border px-5 py-4">
          <div>
            <h2 className="text-base font-bold text-admin-ink">Tài khoản quản trị</h2>
            <p className="text-xs text-admin-muted">Quản lý người dùng, vai trò và chi nhánh phụ trách.</p>
          </div>
          <Button
            variant="primary"
            className="rounded-lg"
            onPress={() => setModal({ kind: "create" })}
          >
            <PlusIcon aria-hidden="true" className="size-4" />
            Thêm tài khoản
          </Button>
        </Card.Header>
        <Card.Content className="p-0">
          {error ? (
            <p role="alert" className="m-4 rounded-lg bg-danger/10 px-3 py-2 text-xs text-danger">
              Không tải được danh sách tài khoản.
            </p>
          ) : null}
          {isLoading ? (
            <p className="p-6 text-center text-sm text-admin-muted">Đang tải tài khoản…</p>
          ) : accounts.length === 0 ? (
            <p className="p-6 text-center text-sm text-admin-muted">Chưa có tài khoản nào.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[40rem] text-sm">
                <thead>
                  <tr className="border-b border-admin-border text-left text-xs text-admin-muted">
                    <th className="px-4 py-3 font-semibold">Tên hiển thị</th>
                    <th className="px-4 py-3 font-semibold">Số điện thoại</th>
                    <th className="px-4 py-3 font-semibold">Vai trò</th>
                    <th className="px-4 py-3 font-semibold">Chi nhánh</th>
                    <th className="px-4 py-3 font-semibold">Trạng thái</th>
                    <th className="px-4 py-3 text-right font-semibold">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-admin-border">
                  {accounts.map((account) => (
                    <tr key={account.id} className="text-admin-ink">
                      <td className="px-4 py-3 font-semibold">{account.displayName}</td>
                      <td className="px-4 py-3 font-mono text-xs">{account.phone}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-admin-soft px-2.5 py-0.5 text-xs text-admin-accent">
                          {roleLabel(account.role)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-admin-muted">{branchLabels(account.branchIds)}</td>
                      <td className="px-4 py-3 text-xs">{accountStatusLabel(account.status)}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-lg border-admin-border"
                            onPress={() => setModal({ kind: "edit", account })}
                          >
                            <PencilSquareIcon aria-hidden="true" className="size-4" />
                            Sửa
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="rounded-lg border-admin-border"
                            onPress={() => setModal({ kind: "reset", account })}
                          >
                            <KeyIcon aria-hidden="true" className="size-4" />
                            Đặt lại mật khẩu
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card.Content>
      </Card>

      <SelfPasswordSection />

      {modal?.kind === "create" || modal?.kind === "edit" ? (
        <AccountFormModal
          account={modal.kind === "edit" ? modal.account : null}
          branches={branches}
          branchesLoading={branchList.isLoading}
          onClose={() => setModal(null)}
          onSaved={() => void mutate()}
        />
      ) : null}

      {modal?.kind === "reset" ? (
        <ResetPasswordDialog account={modal.account} onClose={() => setModal(null)} />
      ) : null}
    </div>
  );
}
