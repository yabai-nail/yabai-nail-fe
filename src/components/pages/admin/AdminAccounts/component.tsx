"use client";

import { PlusIcon } from "@heroicons/react/24/outline";
import { Button, Card } from "@heroui/react";
import { useMemo, useState } from "react";
import { AdminPageLayout } from "@/components/blocks/admin/AdminPageLayout";
import { AdminSearchField } from "@/components/blocks/admin/AdminSearchField";
import { AdminSelectField } from "@/components/blocks/admin/AdminSelectField";
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
import { useTranslations } from "next-intl";
import {
  accountRoles,
  adaptAccount,
  filterAccounts,
  paginate,
  type AccountRow,
} from "./data";

const pageSize = 8;
type Tab = "accounts" | "config";

export function AdminAccountsComponent() {
  const t = useTranslations("admin.accounts");
  const roleLabel = (code: string) => (t.has(`role.${code}`) ? t(`role.${code}`) : code);
  const statusLabel = (code: string) => (t.has(`status.${code}`) ? t(`status.${code}`) : code);

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
            {value === "accounts" ? t("tabs.accounts") : t("tabs.config")}
          </button>
        ))}
      </div>

      {tab === "accounts" ? (
        <>
          <div className="mb-4 flex min-w-0 flex-col gap-3 pb-1 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col gap-1 text-xs font-semibold text-admin-muted">
              Vai trò
              <AdminSelectField
                label={t("filterLabel")}
                value={role}
                onChange={(value) => { setRole(value); setPage(1); }}
                options={[
                  { value: "all", label: t("all") },
                  ...roles.map((code) => ({ value: code, label: roleLabel(code) })),
                ]}
              />
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <AdminSearchField label={t("searchLabel")} placeholder={t("searchPlaceholder")} value={query} onChange={(value) => { setQuery(value); setPage(1); }} />
              <Button variant="primary" className="rounded-lg" onPress={() => setCreating(true)}>
                <PlusIcon className="size-4" />Thêm tài khoản
              </Button>
            </div>
          </div>

          {isLoading ? (
            <p className="mb-3 text-xs text-admin-muted">{t("loading")}</p>
          ) : error ? (
            <p className="mb-3 text-xs text-admin-danger">{t("loadFailed")}</p>
          ) : null}

          <Card className="min-w-0 gap-0 overflow-hidden rounded-lg border-admin-border bg-admin-surface p-0 shadow-none">
            <Card.Content className="min-w-0 overflow-x-auto p-0">
              <table className="w-full min-w-[720px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-admin-border text-left text-xs font-semibold uppercase tracking-wide text-admin-muted">
                    <th className="px-4 py-3">{t("columns.name")}</th>
                    <th className="px-4 py-3">{t("columns.phone")}</th>
                    <th className="px-4 py-3">{t("columns.role")}</th>
                    <th className="px-4 py-3">{t("columns.status")}</th>
                    <th className="px-4 py-3 text-right">{t("columns.actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-admin-muted">{t("empty")}</td></tr>
                  ) : (
                    visible.map((row) => (
                      <tr key={row.id} className="border-b border-admin-border last:border-0">
                        <td className="px-4 py-3 font-medium text-admin-ink">{row.displayName}</td>
                        <td className="px-4 py-3 font-mono text-admin-muted">{row.phone}</td>
                        <td className="px-4 py-3 text-admin-ink">{roleLabel(row.role)}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex rounded-full bg-admin-soft px-2.5 py-1 text-xs font-semibold text-admin-accent">
                            {statusLabel(row.status)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            {/* Both endpoints are for internal accounts only: the update
                                rejects any role outside STAFF/MANAGER/OWNER, and the reset
                                answers 404 for a customer. Offering the buttons on a
                                customer row promised an action that could never run. */}
                            {row.role === "CUSTOMER" ? (
                              <span className="text-xs text-admin-muted">{t("customerAccount")}</span>
                            ) : (
                              <>
                                <Button size="sm" variant="outline" className="rounded-lg" onPress={() => setEditing(row)}>{t("edit")}</Button>
                                <Button size="sm" variant="ghost" className="rounded-lg" onPress={() => setResetting(row)}>{t("resetPassword")}</Button>
                              </>
                            )}
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
  const t = useTranslations("admin.accounts");

  const system = useAdminSystemConfig();
  const loyalty = useAdminLoyaltyConfig();

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {system.data ? (
        <SystemFeaturesForm key={system.data.version} config={system.data} onSaved={() => void system.mutate()} />
      ) : (
        <Card className="rounded-lg border-admin-border bg-admin-surface p-5 text-xs text-admin-muted shadow-none">
          {system.error ? t("systemLoadFailed") : t("systemLoading")}
        </Card>
      )}
      {loyalty.data ? (
        <LoyaltyConfigForm key={loyalty.data.version} config={loyalty.data} onSaved={() => void loyalty.mutate()} />
      ) : (
        <Card className="rounded-lg border-admin-border bg-admin-surface p-5 text-xs text-admin-muted shadow-none">
          {loyalty.error ? t("loyaltyLoadFailed") : t("loyaltyLoading")}
        </Card>
      )}
    </div>
  );
}

function SystemFeaturesForm({
  config,
  onSaved,
}: Readonly<{ config: AdminSystemConfig; onSaved: () => void }>) {
  const t = useTranslations("admin.accounts");

  const [features, setFeatures] = useState<Record<string, boolean>>(() => ({ ...(config.features ?? {}) }));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setBusy(true); setError(null); setMessage(null);
    try {
      await adminService.updateSystemConfig({ features }, config.version);
      setMessage(t("systemSaved"));
      onSaved();
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : t("systemSaveFailed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="gap-3 rounded-lg border-admin-border bg-admin-surface p-5 shadow-none">
      <h2 className="text-sm font-bold text-admin-ink">{t("featuresHeading")}</h2>
      {Object.keys(features).length === 0 ? (
        <p className="text-xs text-admin-muted">{t("noFeatures")}</p>
      ) : (
        Object.entries(features).map(([key, value]) => (
          <label key={key} className="flex items-center justify-between gap-3 text-sm text-admin-ink">
            <span>{key}</span>
            <input type="checkbox" className="accent-admin-accent" checked={value} onChange={(event) => setFeatures((prev) => ({ ...prev, [key]: event.target.checked }))} />
          </label>
        ))
      )}
      {message ? <p className="text-sm text-admin-accent">{message}</p> : null}
      {error ? <p className="text-sm text-admin-danger" role="alert">{error}</p> : null}
      <div>
        <Button variant="primary" className="rounded-lg" isDisabled={busy} onPress={() => void save()}>{t("saveFeatures")}</Button>
      </div>
    </Card>
  );
}

function LoyaltyConfigForm({
  config,
  onSaved,
}: Readonly<{ config: AdminLoyaltyConfig; onSaved: () => void }>) {
  const t = useTranslations("admin.accounts");

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
      setError(t("loyaltyInvalidJson"));
      return;
    }
    setBusy(true); setError(null); setMessage(null);
    try {
      await adminService.updateLoyaltyConfig(parsed, config.version);
      setMessage(t("loyaltySaved"));
      onSaved();
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : t("loyaltySaveFailed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="gap-3 rounded-lg border-admin-border bg-admin-surface p-5 shadow-none">
      <h2 className="text-sm font-bold text-admin-ink">{t("loyaltyHeading")}</h2>
      <textarea className="min-h-40 rounded-lg border border-admin-border bg-admin-surface px-3 py-2 font-mono text-xs text-admin-ink" value={text} onChange={(event) => setText(event.target.value)} />
      {message ? <p className="text-sm text-admin-accent">{message}</p> : null}
      {error ? <p className="text-sm text-admin-danger" role="alert">{error}</p> : null}
      <div>
        <Button variant="primary" className="rounded-lg" isDisabled={busy} onPress={() => void save()}>{t("saveLoyalty")}</Button>
      </div>
    </Card>
  );
}

export const meta = { world: "connected", domain: "admin-accounts" } as const;
