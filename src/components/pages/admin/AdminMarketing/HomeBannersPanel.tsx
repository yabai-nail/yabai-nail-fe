"use client";

import { ArrowDownIcon, ArrowUpIcon, PencilSquareIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { Button, Card, Chip } from "@heroui/react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { notifySuccess } from "@/lib/app-toast";
import { adminService, useAdminHomeBanners, type AdminHomeBanners } from "@/service";
import { HomeBannerModal } from "./HomeBannerModal";
import {
  HOME_BANNER_LIMIT,
  moveBannerAt,
  removeBannerAt,
  toBannerDrafts,
  toBannerInputs,
  upsertBanner,
  type BannerDraft,
} from "./home-banners";

/**
 * The customer app's home carousel, edited as one list and saved as one request. Reordering,
 * toggling and editing are local until Save, so the admin can arrange the whole strip and
 * commit it once under one version check instead of racing themselves slide by slide.
 */
export function HomeBannersPanel({ canWrite }: Readonly<{ canWrite: boolean }>) {
  const t = useTranslations("admin.marketing.banners");
  const query = useAdminHomeBanners();
  if (query.isLoading) return <p className="text-xs text-admin-muted">{t("loading")}</p>;
  if (query.error || !query.data) return <p role="alert" className="text-xs text-admin-danger">{t("loadFailed")}</p>;
  return <HomeBannersEditor key={query.data.version} data={query.data} canWrite={canWrite} onSaved={(next) => void query.mutate(next, { revalidate: false })} />;
}

function HomeBannersEditor({
  data,
  canWrite,
  onSaved,
}: Readonly<{ data: AdminHomeBanners; canWrite: boolean; onSaved: (next: AdminHomeBanners) => void }>) {
  const t = useTranslations("admin.marketing.banners");
  const [items, setItems] = useState<ReadonlyArray<BannerDraft>>(() => toBannerDrafts(data.items));
  const [editing, setEditing] = useState<BannerDraft | null | "new">(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dirty = JSON.stringify(toBannerInputs(items)) !== JSON.stringify(toBannerInputs(toBannerDrafts(data.items)));
  const atLimit = items.length >= HOME_BANNER_LIMIT;

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      const saved = await adminService.updateHomeBanners(toBannerInputs(items), data.version);
      onSaved(saved);
      notifySuccess(t("saved"));
    } catch (thrown) {
      setError(thrown instanceof Error && thrown.message ? thrown.message : t("saveFailed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="min-w-0 gap-0 rounded-lg border-admin-border bg-admin-surface p-0 shadow-none">
      <Card.Header className="flex flex-row flex-wrap items-start justify-between gap-3 border-b border-admin-border px-5 py-4">
        <div>
          <h2 className="font-bold text-admin-ink">{t("heading")}</h2>
          <p className="mt-1 text-xs text-admin-muted">{t("description", { limit: HOME_BANNER_LIMIT })}</p>
        </div>
        <Button
          variant="outline"
          className="rounded-lg border-admin-border"
          isDisabled={!canWrite || busy || atLimit}
          onPress={() => setEditing("new")}
        >
          <PlusIcon className="size-4" />{t("add")}
        </Button>
      </Card.Header>
      <Card.Content className="grid gap-3 p-5">
        {items.length === 0 ? (
          <p role="status" className="rounded-xl border border-admin-border p-6 text-center text-sm text-admin-muted">{t("empty")}</p>
        ) : (
          <ol className="grid gap-2">
            {items.map((item, index) => (
              <li key={item.key} className={`flex items-center gap-3 rounded-xl border p-3 ${item.active ? "border-admin-border" : "border-admin-border bg-admin-soft/60"}`}>
                <span className="w-5 shrink-0 text-center text-xs font-semibold tabular-nums text-admin-muted">{index + 1}</span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.imageUrl} alt="" className="h-14 w-24 shrink-0 rounded-lg border border-admin-border object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-admin-ink">{item.title ?? t("untitled")}</p>
                  {item.link ? <p className="truncate text-xs text-admin-muted">{item.link}</p> : null}
                </div>
                <label className="flex shrink-0 items-center gap-2 text-xs text-admin-ink">
                  <input
                    type="checkbox"
                    className="accent-admin-accent"
                    checked={item.active}
                    disabled={!canWrite || busy}
                    onChange={(event) => setItems((current) => upsertBanner(current, { ...item, active: event.target.checked }))}
                  />
                  <Chip size="sm" variant="soft" color={item.active ? "success" : "default"}>
                    <Chip.Label>{item.active ? t("active") : t("hidden")}</Chip.Label>
                  </Chip>
                </label>
                <div className="flex shrink-0 gap-1">
                  <Button isIconOnly size="sm" variant="ghost" aria-label={t("moveUp")} isDisabled={!canWrite || busy || index === 0} onPress={() => setItems((current) => moveBannerAt(current, index, -1))}>
                    <ArrowUpIcon className="size-4" />
                  </Button>
                  <Button isIconOnly size="sm" variant="ghost" aria-label={t("moveDown")} isDisabled={!canWrite || busy || index === items.length - 1} onPress={() => setItems((current) => moveBannerAt(current, index, 1))}>
                    <ArrowDownIcon className="size-4" />
                  </Button>
                  <Button isIconOnly size="sm" variant="ghost" aria-label={t("edit")} isDisabled={!canWrite || busy} onPress={() => setEditing(item)}>
                    <PencilSquareIcon className="size-4" />
                  </Button>
                  <Button isIconOnly size="sm" variant="ghost" className="text-admin-danger" aria-label={t("remove")} isDisabled={!canWrite || busy} onPress={() => setItems((current) => removeBannerAt(current, index))}>
                    <TrashIcon className="size-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ol>
        )}
        {error ? <p role="alert" className="text-sm text-admin-danger">{error}</p> : null}
      </Card.Content>
      <Card.Footer className="flex items-center justify-between gap-3 border-t border-admin-border px-5 py-3">
        <span className="text-xs text-admin-muted">{dirty ? t("unsaved") : ""}</span>
        <Button variant="primary" className="rounded-lg" isDisabled={!canWrite || busy || !dirty} onPress={() => void save()}>
          {busy ? t("saving") : t("save")}
        </Button>
      </Card.Footer>
      {editing !== null ? (
        <HomeBannerModal
          banner={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onDone={(draft) => setItems((current) => upsertBanner(current, draft))}
        />
      ) : null}
    </Card>
  );
}
