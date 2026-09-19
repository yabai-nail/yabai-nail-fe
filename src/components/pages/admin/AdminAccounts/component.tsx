"use client";

import { useTranslations } from "next-intl";
import { ExclamationTriangleIcon, LinkIcon, PlusIcon } from "@heroicons/react/24/outline";
import { Button, Card } from "@heroui/react";
import { useMemo, useState } from "react";
import { AdminAvatarZoom } from "@/components/blocks/admin/AdminAvatarField";
import { AdminPagination } from "@/components/blocks/admin/AdminPagination";
import { AdminPageLayout } from "@/components/blocks/admin/AdminPageLayout";
import { AdminSearchField } from "@/components/blocks/admin/AdminSearchField";
import { AdminSelectField } from "@/components/blocks/admin/AdminSelectField";
import { notifySuccess } from "@/lib/app-toast";
import {
  adminService,
  useAdminAccountRoles,
  useAdminAccounts,
  useAdminLoyaltyConfig,
  useAdminStaff,
  useAdminSystemConfig,
  useAdminPermission,
  type AdminLoyaltyConfig,
  type AdminSystemConfig,
} from "@/service";
import { AccountModal } from "./AccountModal";
import { LinkStaffModal } from "./LinkStaffModal";
import { ResetPasswordModal } from "./ResetPasswordModal";
import {
  accountRoles,
  adaptAccount,
  capabilityAreas,
  filterAccounts,
  paginate,
  staffByAccount,
  unlinkedStaff,
  type AccountRow,
} from "./data";

const pageSize = 8;
type Tab = "accounts" | "config";

export function AdminAccountsComponent() {
  const t = useTranslations("admin.accounts");
  const canWriteAccounts = useAdminPermission("account.write.all");
  const statusLabel = (code: string) =>
    t.has(`status.${code}`) ? t(`status.${code}`) : code;
  const roleLabel = (code: string) =>
    t.has(`role.${code}`) ? t(`role.${code}`) : code;
  const areaLabel = (code: string) =>
    t.has(`areas.${code}`) ? t(`areas.${code}`) : code;
  const [tab, setTab] = useState<Tab>("accounts");
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("all");
  const { data, isLoading, error, mutate } = useAdminAccounts({
    q: query.trim() || undefined,
    role: role === "all" ? undefined : role,
  });
  const overview = useAdminAccountRoles();
  // Every profile of the chain (the owner sees all branches), so each login can show the
  // profile it is linked to; a STAFF login without one cannot sign in.
  const staff = useAdminStaff({ limit: 100 });
  const profiles = useMemo(() => staffByAccount(staff.data?.items ?? []), [staff.data]);
  const candidates = useMemo(() => unlinkedStaff(staff.data?.items ?? []), [staff.data]);

  const source = useMemo<ReadonlyArray<AccountRow>>(
    () => (data?.items ? data.items.map(adaptAccount) : []),
    [data],
  );

  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<AccountRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [resetting, setResetting] = useState<AccountRow | null>(null);
  const [linking, setLinking] = useState<AccountRow | null>(null);

  const roles = useMemo(
    () => Array.from(new Set(["CUSTOMER", "MANAGER", "OWNER", "STAFF", ...accountRoles(source)])),
    [source],
  );
  const filtered = useMemo(() => filterAccounts(source, role, query), [source, role, query]);
  const { items: visible, page: currentPage, pageCount } = paginate(filtered, page, pageSize);

  const refreshAll = () => {
    void mutate();
    void staff.mutate();
    void overview.mutate();
  };

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
          <section aria-label={t("overview.heading")} className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {overview.error ? (
              <p className="text-xs text-admin-danger sm:col-span-2 lg:col-span-4">{t("overview.loadFailed")}</p>
            ) : (
              (overview.data?.roles ?? []).map((summary) => {
                const selected = role === summary.role;
                return (
                  <button
                    key={summary.role}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => { setRole(selected ? "all" : summary.role); setPage(1); }}
                    className={`rounded-lg border p-4 text-left ${selected ? "border-admin-accent bg-admin-soft" : "border-admin-border bg-admin-surface"}`}
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-sm font-bold text-admin-ink">{roleLabel(summary.role)}</span>
                      <span className="text-2xl font-bold text-admin-accent">{summary.accountCount}</span>
                    </div>
                    <p className="mt-1 text-xs text-admin-muted">{t("overview.active", { count: summary.activeCount })}</p>
                    <p className="mt-2 text-xs text-admin-muted">
                      {summary.permissions.length === 0
                        ? t("overview.noConsole")
                        : capabilityAreas(summary.permissions).map(areaLabel).join(" · ")}
                    </p>
                  </button>
                );
              })
            )}
          </section>

          <div className="mb-4 flex min-w-0 flex-col gap-3 pb-1 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col gap-1 text-xs font-semibold text-admin-muted">
              {t("columns.role")}
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
              <Button variant="primary" className="rounded-lg" isDisabled={!canWriteAccounts} onPress={() => setCreating(true)}>
                <PlusIcon className="size-4" />{t("add")}
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
              <table className="w-full min-w-[880px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-admin-border text-left text-xs font-semibold uppercase tracking-wide text-admin-muted">
                    <th className="px-4 py-3">{t("columns.name")}</th>
                    <th className="px-4 py-3">{t("columns.phone")}</th>
                    <th className="px-4 py-3">{t("columns.role")}</th>
                    <th className="px-4 py-3">{t("columns.status")}</th>
                    <th className="px-4 py-3">{t("staffProfile.column")}</th>
                    <th className="px-4 py-3 text-right">{t("columns.actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.length === 0 ? (
                    <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-admin-muted">{t("empty")}</td></tr>
                  ) : (
                    visible.map((row) => {
                      const linked = profiles.get(row.id) ?? null;
                      const internal = row.role !== "CUSTOMER";
                      return (
                        <tr key={row.id} className="border-b border-admin-border last:border-0">
                          <td className="px-4 py-3 font-medium text-admin-ink">
                            <div className="flex items-center gap-2">
                              <AdminAvatarZoom src={row.avatarUrl} name={row.displayName} size="sm" />
                              <span className="truncate">{row.displayName}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 font-mono text-admin-muted">{row.phone}</td>
                          <td className="px-4 py-3 text-admin-ink">{roleLabel(row.role)}</td>
                          <td className="px-4 py-3">
                            <span className="inline-flex rounded-full bg-admin-soft px-2.5 py-1 text-xs font-semibold text-admin-accent">
                              {statusLabel(row.status)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-xs">
                            {!internal ? (
                              <span className="text-admin-muted">{t("staffProfile.notApplicable")}</span>
                            ) : linked ? (
                              <span className="text-admin-ink">{linked.displayName}</span>
                            ) : row.role === "STAFF" ? (
                              <span className="inline-flex items-center gap-1 font-semibold text-admin-danger">
                                <ExclamationTriangleIcon aria-hidden className="size-4" />{t("staffProfile.missingBlocksLogin")}
                              </span>
                            ) : (
                              <span className="text-admin-muted">{t("staffProfile.missing")}</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-end gap-2">
                              {/* Both endpoints are for internal accounts only: the update
                                  rejects any role outside STAFF/MANAGER/OWNER, and the reset
                                  answers 404 for a customer. Offering the buttons on a
                                  customer row promised an action that could never run. */}
                              {!internal ? (
                                <span className="text-xs text-admin-muted">{t("customerAccount")}</span>
                              ) : (
                                <>
                                  <Button size="sm" variant="outline" className="rounded-lg" isDisabled={!canWriteAccounts} onPress={() => setLinking(row)}>
                                    <LinkIcon className="size-4" />{linked ? t("staffProfile.unlink") : t("staffProfile.link")}
                                  </Button>
                                  <Button size="sm" variant="outline" className="rounded-lg" isDisabled={!canWriteAccounts} onPress={() => setEditing(row)}>{t("edit")}</Button>
                                  <Button size="sm" variant="ghost" className="rounded-lg" isDisabled={!canWriteAccounts} onPress={() => setResetting(row)}>{t("resetPassword")}</Button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </Card.Content>
            <Card.Footer className="flex items-center justify-between border-t border-admin-border px-4 py-3 text-xs text-admin-muted">
              <span>{t("pagination", { shown: visible.length, total: filtered.length })}</span>
              <AdminPagination page={currentPage} pageCount={pageCount} onPageChange={setPage} />
            </Card.Footer>
          </Card>
        </>
      ) : (
        <ConfigPanel />
      )}

      {canWriteAccounts && creating ? <AccountModal account={null} onClose={() => setCreating(false)} onSaved={refreshAll} /> : null}
      {canWriteAccounts && editing ? <AccountModal account={editing} onClose={() => setEditing(null)} onSaved={refreshAll} /> : null}
      {canWriteAccounts && resetting ? <ResetPasswordModal accountId={resetting.id} accountName={resetting.displayName} onClose={() => setResetting(null)} onDone={() => void mutate()} /> : null}
      {canWriteAccounts && linking ? (
        <LinkStaffModal account={linking} linked={profiles.get(linking.id) ?? null} candidates={candidates} onClose={() => setLinking(null)} onDone={refreshAll} />
      ) : null}
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
  const tc = useTranslations("admin.common");
  const canWrite = useAdminPermission("system.config.write.all");
  const [features, setFeatures] = useState<Record<string, boolean>>(() => ({ ...(config.features ?? {}) }));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setBusy(true); setError(null);
    try {
      await adminService.updateSystemConfig({ features }, config.version);
      notifySuccess(tc("systemSaved"));
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
            <input type="checkbox" className="accent-admin-accent" checked={value} disabled={!canWrite || busy} onChange={(event) => setFeatures((prev) => ({ ...prev, [key]: event.target.checked }))} />
          </label>
        ))
      )}
      {error ? <p className="text-sm text-admin-danger" role="alert">{error}</p> : null}
      <div>
        <Button variant="primary" className="rounded-lg" isDisabled={!canWrite || busy} onPress={() => void save()}>{t("saveFeatures")}</Button>
      </div>
    </Card>
  );
}

function LoyaltyConfigForm({
  config,
  onSaved,
}: Readonly<{ config: AdminLoyaltyConfig; onSaved: () => void }>) {
  const t = useTranslations("admin.accounts");
  const tc = useTranslations("admin.common");
  const canWrite = useAdminPermission("loyalty.config.write.all");
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
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(text) as Record<string, unknown>;
    } catch {
      setError(t("loyaltyInvalidJson"));
      return;
    }
    setBusy(true); setError(null);
    try {
      await adminService.updateLoyaltyConfig(parsed, config.version);
      notifySuccess(tc("loyaltySaved"));
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
      <textarea className="min-h-40 rounded-lg border border-admin-border bg-admin-surface px-3 py-2 font-mono text-xs text-admin-ink disabled:bg-admin-canvas disabled:text-admin-muted" value={text} disabled={!canWrite || busy} onChange={(event) => setText(event.target.value)} />
      {error ? <p className="text-sm text-admin-danger" role="alert">{error}</p> : null}
      <div>
        <Button variant="primary" className="rounded-lg" isDisabled={!canWrite || busy} onPress={() => void save()}>{t("saveLoyalty")}</Button>
      </div>
    </Card>
  );
}

export const meta = { world: "connected", domain: "admin-accounts" } as const;
