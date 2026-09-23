"use client";

import { ArrowDownIcon, ArrowUpIcon, PencilSquareIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { Button, Card, Chip, Modal } from "@heroui/react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { notifyError, notifySuccess } from "@/lib/app-toast";
import { adminService, useAdminBranchList, useAdminHomeAnnouncements, type AdminHomeAnnouncements } from "@/service";
import { HomeAnnouncementModal } from "./HomeAnnouncementModal";
import {
  HOME_ANNOUNCEMENT_LIMIT,
  isVersionConflict,
  moveAnnouncementAt,
  removeAnnouncementAt,
  toAnnouncementDrafts,
  toAnnouncementInputs,
  upsertAnnouncement,
  type AnnouncementDraft,
} from "./home-announcements";

/**
 * Salon news on the customer app's home strip, edited as one list and saved as one request —
 * the same flow as the home banners, so reordering several items is one version check.
 */
export function HomeAnnouncementsPanel({ canWrite }: Readonly<{ canWrite: boolean }>) {
  const t = useTranslations("admin.marketing.announcements");
  const query = useAdminHomeAnnouncements();
  if (query.isLoading) return <p className="text-xs text-admin-muted">{t("loading")}</p>;
  if (query.error || !query.data) return <p role="alert" className="text-xs text-admin-danger">{t("loadFailed")}</p>;
  return (
    <HomeAnnouncementsEditor
      key={query.data.version}
      data={query.data}
      canWrite={canWrite}
      onSaved={(next) => void query.mutate(next, { revalidate: false })}
      onConflict={() => void query.mutate()}
    />
  );
}

function HomeAnnouncementsEditor({
  data,
  canWrite,
  onSaved,
  onConflict,
}: Readonly<{ data: AdminHomeAnnouncements; canWrite: boolean; onSaved: (next: AdminHomeAnnouncements) => void; onConflict: () => void }>) {
  const t = useTranslations("admin.marketing.announcements");
  const branches = useAdminBranchList();
  const branchNames = new Map((branches.data?.items ?? []).map((branch) => [branch.id, branch.name] as const));
  const [items, setItems] = useState<ReadonlyArray<AnnouncementDraft>>(() => toAnnouncementDrafts(data.items));
  const [editing, setEditing] = useState<AnnouncementDraft | null | "new">(null);
  const [removing, setRemoving] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dirty = JSON.stringify(toAnnouncementInputs(items)) !== JSON.stringify(toAnnouncementInputs(toAnnouncementDrafts(data.items)));
  const atLimit = items.length >= HOME_ANNOUNCEMENT_LIMIT;

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      onSaved(await adminService.updateHomeAnnouncements(toAnnouncementInputs(items), data.version));
      notifySuccess(t("saved"));
    } catch (thrown) {
      if (isVersionConflict(thrown)) {
        notifyError(t("conflict"));
        onConflict();
      } else {
        setError(thrown instanceof Error && thrown.message ? thrown.message : t("saveFailed"));
      }
    } finally {
      setBusy(false);
    }
  };
  const scope = (item: AnnouncementDraft) =>
    item.branchIds.length ? item.branchIds.map((id) => branchNames.get(id) ?? id).join(", ") : t("allBranches");
  const window = (item: AnnouncementDraft) =>
    item.startDate || item.endDate ? t("window", { from: item.startDate || t("openStart"), to: item.endDate || t("openEnd") }) : t("always");

  return (
    <Card className="min-w-0 gap-0 rounded-lg border-admin-border bg-admin-surface p-0 shadow-none">
      <Card.Header className="flex flex-row flex-wrap items-start justify-between gap-3 border-b border-admin-border px-5 py-4">
        <div>
          <h2 className="font-bold text-admin-ink">{t("heading")}</h2>
          <p className="mt-1 text-xs text-admin-muted">{t("description", { limit: HOME_ANNOUNCEMENT_LIMIT })}</p>
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
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-admin-ink">{item.title}</p>
                  {item.message ? <p className="truncate text-xs text-admin-muted line-clamp-1">{item.message}</p> : null}
                  <p className="truncate text-xs text-admin-muted">{`${scope(item)} · ${window(item)}`}</p>
                </div>
                <label className="flex shrink-0 items-center gap-2 text-xs text-admin-ink">
                  <input
                    type="checkbox"
                    className="accent-admin-accent"
                    checked={item.active}
                    disabled={!canWrite || busy}
                    onChange={(event) => setItems((current) => upsertAnnouncement(current, { ...item, active: event.target.checked }))}
                  />
                  <Chip size="sm" variant="soft" color={item.active ? "success" : "default"}>
                    <Chip.Label>{item.active ? t("active") : t("hidden")}</Chip.Label>
                  </Chip>
                </label>
                <div className="flex shrink-0 gap-1">
                  <Button isIconOnly size="sm" variant="ghost" aria-label={t("moveUp")} isDisabled={!canWrite || busy || index === 0} onPress={() => setItems((current) => moveAnnouncementAt(current, index, -1))}>
                    <ArrowUpIcon className="size-4" />
                  </Button>
                  <Button isIconOnly size="sm" variant="ghost" aria-label={t("moveDown")} isDisabled={!canWrite || busy || index === items.length - 1} onPress={() => setItems((current) => moveAnnouncementAt(current, index, 1))}>
                    <ArrowDownIcon className="size-4" />
                  </Button>
                  <Button isIconOnly size="sm" variant="ghost" aria-label={t("edit")} isDisabled={!canWrite || busy} onPress={() => setEditing(item)}>
                    <PencilSquareIcon className="size-4" />
                  </Button>
                  <Button isIconOnly size="sm" variant="ghost" className="text-admin-danger" aria-label={t("remove")} isDisabled={!canWrite || busy} onPress={() => setRemoving(index)}>
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
        <HomeAnnouncementModal
          announcement={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onDone={(draft) => setItems((current) => upsertAnnouncement(current, draft))}
        />
      ) : null}
      {removing !== null ? (
        <Modal isOpen onOpenChange={(open) => { if (!open) setRemoving(null); }}>
          <Modal.Backdrop>
            <Modal.Container size="sm" placement="center">
              <Modal.Dialog>
                <Modal.Header className="border-b border-admin-border px-5 py-4">
                  <Modal.Heading className="text-base font-bold text-admin-ink">{t("confirmRemoveTitle")}</Modal.Heading>
                </Modal.Header>
                <Modal.Body className="px-5 py-4 text-sm text-admin-ink">{t("confirmRemove", { title: items[removing]?.title ?? "" })}</Modal.Body>
                <Modal.Footer className="flex justify-end gap-2 border-t border-admin-border px-5 py-3">
                  <Button variant="ghost" className="rounded-lg" onPress={() => setRemoving(null)}>{t("cancel")}</Button>
                  <Button variant="danger" className="rounded-lg" onPress={() => { setItems((current) => removeAnnouncementAt(current, removing)); setRemoving(null); }}>{t("confirmRemoveAction")}</Button>
                </Modal.Footer>
              </Modal.Dialog>
            </Modal.Container>
          </Modal.Backdrop>
        </Modal>
      ) : null}
    </Card>
  );
}
