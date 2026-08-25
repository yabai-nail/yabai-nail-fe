"use client";

import { PlusIcon } from "@heroicons/react/24/outline";
import { Button, Card } from "@heroui/react";
import { useMemo, useState } from "react";
import { AdminPageLayout } from "@/components/blocks/admin/AdminPageLayout";
import { AdminSearchField } from "@/components/blocks/admin/AdminSearchField";
import {
  adminService,
  useAdminAccounts,
  useAdminLoyaltyConfig,
  useAdminSystemConfig,
  type AdminLoyaltyConfig,
  type AdminSystemConfig,
} from "@/service";
import { AccountModal } from "./AccountModal";
import { ResetPasswordModal } from "./ResetPasswordModal";
import {
  accountRoles,
  accountStatusLabels,
  adaptAccount,
  filterAccounts,
  paginate,
  roleLabels,
  type AccountRow,
} from "./data";

const pageSize = 8;
type Tab = "accounts" | "config";

export function AdminAccountsComponent() {
  const [tab, setTab] = useState<Tab>("accounts");
  const { data, isLoading, error, mutate } = useAdminAccounts();

  const source = useMemo<ReadonlyArray<AccountRow>>(
    () => (data?.items ? data.items.map(adaptAccount) : []),
    [data],
  );

  const [query, setQuery] = useState("");
  const [role, setRole] = useState("all");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<AccountRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [resetting, setResetting] = useState<AccountRow | null>(null);

  const roles = useMemo(() => accountRoles(source), [source]);
  const filtered = useMemo(() => filterAccounts(source, role, query), [source, role, query]);
  const { items: visible, page: currentPage, pageCount } = paginate(filtered, page, pageSize);

  return (
    <AdminPageLayout>
      <div className="mb-4 flex gap-1 border-b border-admin-border">
        {(["accounts", "config"] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            className={`min-h-11 rounded-t-lg px-4 text-sm font-semibold ${
              tab === value ? "border-b-2 border-admin-accent text-admin-accent" : "text-admin-muted"
            }`}
          >
            {value === "accounts" ? "Tài khoản" : "Cấu hình"}
          </button>
        ))}
      </div>

      {tab === "accounts" ? (
        <>
          <div className="mb-4 flex min-w-0 flex-col gap-3 pb-1 sm:flex-row sm:items-end sm:justify-between">
            <label className="flex flex-col gap-1 text-xs font-semibold text-admin-muted">
              Vai trò
              <select value={role} onChange={(event) => { setRole(event.target.value); setPage(1); }} className="min-h-11 rounded-lg border border-admin-border bg-admin-surface px-3 text-sm text-admin-ink">
                <option value="all">Tất cả</option>
                {roles.map((code) => (<option key={code} value={code}>{roleLabels[code] ?? code}</option>))}
              </select>
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <AdminSearchField label="Tìm tài khoản" placeholder="Tên hoặc SĐT..." value={query} onChange={(value) => { setQuery(value); setPage(1); }} />
              <Button variant="primary" className="rounded-lg" onPress={() => setCreating(true)}>
                <PlusIcon className="size-4" />Thêm tài khoản
              </Button>
            </div>
          </div>

          {isLoading ? (
            <p className="mb-3 text-xs text-admin-muted">Đang tải tài khoản…</p>
          ) : error ? (
            <p className="mb-3 text-xs text-admin-danger">Không tải được danh sách tài khoản.</p>
          ) : null}

          <Card className="min-w-0 gap-0 overflow-hidden rounded-lg border-admin-border bg-admin-surface p-0 shadow-none">
            <Card.Content className="min-w-0 overflow-x-auto p-0">
              <table className="w-full min-w-[720px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-admin-border text-left text-xs font-semibold uppercase tracking-wide text-admin-muted">
                    <th className="px-4 py-3">Tên</th>
                    <th className="px-4 py-3">SĐT</th>
                    <th className="px-4 py-3">Vai trò</th>
                    <th className="px-4 py-3">Trạng thái</th>
                    <th className="px-4 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-admin-muted">Không có tài khoản phù hợp.</td></tr>
                  ) : (
                    visible.map((row) => (
                      <tr key={row.id} className="border-b border-admin-border last:border-0">
                        <td className="px-4 py-3 font-medium text-admin-ink">{row.displayName}</td>
                        <td className="px-4 py-3 font-mono text-admin-muted">{row.phone}</td>
                        <td className="px-4 py-3 text-admin-ink">{roleLabels[row.role] ?? row.role}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex rounded-full bg-admin-soft px-2.5 py-1 text-xs font-semibold text-admin-accent">
                            {accountStatusLabels[row.status] ?? row.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="outline" className="rounded-lg" onPress={() => setEditing(row)}>Sửa</Button>
                            <Button size="sm" variant="ghost" className="rounded-lg" onPress={() => setResetting(row)}>Đặt lại MK</Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </Card.Content>
            <Card.Footer className="flex items-center justify-between border-t border-admin-border px-4 py-3 text-xs text-admin-muted">
              <span>Hiển thị {visible.length} trong tổng số {filtered.length} tài khoản</span>
              <div className="flex gap-1">
                {Array.from({ length: pageCount }, (_, index) => index + 1).map((value) => (
                  <Button key={value} size="sm" variant={currentPage === value ? "outline" : "ghost"} className={currentPage === value ? "min-w-9 rounded-lg border-admin-accent text-admin-accent" : "min-w-9"} onPress={() => setPage(value)}>{value}</Button>
                ))}
              </div>
            </Card.Footer>
          </Card>
        </>
      ) : (
        <ConfigPanel />
      )}

      {creating ? <AccountModal account={null} onClose={() => setCreating(false)} onSaved={() => void mutate()} /> : null}
      {editing ? <AccountModal account={editing} onClose={() => setEditing(null)} onSaved={() => void mutate()} /> : null}
      {resetting ? <ResetPasswordModal accountId={resetting.id} accountName={resetting.displayName} onClose={() => setResetting(null)} onDone={() => void mutate()} /> : null}
    </AdminPageLayout>
  );
}

function ConfigPanel() {
  const system = useAdminSystemConfig();
  const loyalty = useAdminLoyaltyConfig();

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {system.data ? (
        <SystemFeaturesForm key={system.data.version} config={system.data} onSaved={() => void system.mutate()} />
      ) : (
        <Card className="rounded-lg border-admin-border bg-admin-surface p-5 text-xs text-admin-muted shadow-none">
          {system.error ? "Không tải được cấu hình hệ thống." : "Đang tải cấu hình hệ thống…"}
        </Card>
      )}
      {loyalty.data ? (
        <LoyaltyConfigForm key={loyalty.data.version} config={loyalty.data} onSaved={() => void loyalty.mutate()} />
      ) : (
        <Card className="rounded-lg border-admin-border bg-admin-surface p-5 text-xs text-admin-muted shadow-none">
          {loyalty.error ? "Không tải được cấu hình loyalty." : "Đang tải cấu hình loyalty…"}
        </Card>
      )}
    </div>
  );
}

function SystemFeaturesForm({
  config,
  onSaved,
}: Readonly<{ config: AdminSystemConfig; onSaved: () => void }>) {
  const [features, setFeatures] = useState<Record<string, boolean>>(() => ({ ...(config.features ?? {}) }));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setBusy(true); setError(null); setMessage(null);
    try {
      await adminService.updateSystemConfig({ features }, config.version);
      setMessage("Đã lưu cấu hình hệ thống.");
      onSaved();
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "Không lưu được cấu hình hệ thống.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="gap-3 rounded-lg border-admin-border bg-admin-surface p-5 shadow-none">
      <h2 className="text-sm font-bold text-admin-ink">Tính năng hệ thống</h2>
      {Object.keys(features).length === 0 ? (
        <p className="text-xs text-admin-muted">Chưa có tính năng nào để cấu hình.</p>
      ) : (
        Object.entries(features).map(([key, value]) => (
          <label key={key} className="flex items-center justify-between gap-3 text-sm text-admin-ink">
            <span>{key}</span>
            <input type="checkbox" checked={value} onChange={(event) => setFeatures((prev) => ({ ...prev, [key]: event.target.checked }))} />
          </label>
        ))
      )}
      {message ? <p className="text-sm text-admin-accent">{message}</p> : null}
      {error ? <p className="text-sm text-admin-danger" role="alert">{error}</p> : null}
      <div>
        <Button variant="primary" className="rounded-lg" isDisabled={busy} onPress={() => void save()}>Lưu tính năng</Button>
      </div>
    </Card>
  );
}

function LoyaltyConfigForm({
  config,
  onSaved,
}: Readonly<{ config: AdminLoyaltyConfig; onSaved: () => void }>) {
  // Seed the editor with the whole config, minus the fields the server owns.
  // It used to seed { tiers, rules } only — `rules` is not part of the response
  // at all, and dropping pointRate, redemptionCapPercent and redemptionIncrement
  // meant every save replaced the record with one missing required fields and
  // came back "Cau hinh diem khong hop le."
  const [text, setText] = useState(() => {
    const editable: Record<string, unknown> = { ...config };
    delete editable.version;
    delete editable.effectiveVersion;
    return JSON.stringify(editable, null, 2);
  });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(text) as Record<string, unknown>;
    } catch {
      setError("JSON cấu hình loyalty không hợp lệ.");
      return;
    }
    setBusy(true); setError(null); setMessage(null);
    try {
      await adminService.updateLoyaltyConfig(parsed, config.version);
      setMessage("Đã lưu cấu hình loyalty.");
      onSaved();
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "Không lưu được cấu hình loyalty.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="gap-3 rounded-lg border-admin-border bg-admin-surface p-5 shadow-none">
      <h2 className="text-sm font-bold text-admin-ink">Cấu hình loyalty (JSON)</h2>
      <textarea className="min-h-40 rounded-lg border border-admin-border bg-admin-surface px-3 py-2 font-mono text-xs text-admin-ink" value={text} onChange={(event) => setText(event.target.value)} />
      {message ? <p className="text-sm text-admin-accent">{message}</p> : null}
      {error ? <p className="text-sm text-admin-danger" role="alert">{error}</p> : null}
      <div>
        <Button variant="primary" className="rounded-lg" isDisabled={busy} onPress={() => void save()}>Lưu loyalty</Button>
      </div>
    </Card>
  );
}

export const meta = { world: "connected", domain: "admin-accounts" } as const;
