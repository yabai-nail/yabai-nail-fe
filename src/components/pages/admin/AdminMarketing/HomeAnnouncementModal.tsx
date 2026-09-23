"use client";

import { Button, Modal } from "@heroui/react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { useAdminBranchList } from "@/service";
import { validateAnnouncementDraft, type AnnouncementDraft } from "./home-announcements";

/**
 * Adds or edits one announcement. Nothing is sent from here: the draft goes back to the panel,
 * whose Save writes the whole list under one version check.
 */
export function HomeAnnouncementModal({
  announcement,
  onClose,
  onDone,
}: Readonly<{
  announcement: AnnouncementDraft | null;
  onClose: () => void;
  onDone: (draft: AnnouncementDraft) => void;
}>) {
  const t = useTranslations("admin.marketing.announcements.modal");
  const branches = useAdminBranchList();
  const [draft, setDraft] = useState<AnnouncementDraft>(
    () => announcement ?? { key: crypto.randomUUID(), id: null, title: "", message: "", branchIds: [], startDate: "", endDate: "", active: true },
  );
  const [touched, setTouched] = useState(false);
  const error = validateAnnouncementDraft(draft);
  const set = (patch: Partial<AnnouncementDraft>) => setDraft((current) => ({ ...current, ...patch }));
  const toggleBranch = (id: string, checked: boolean) =>
    set({ branchIds: checked ? [...draft.branchIds, id] : draft.branchIds.filter((value) => value !== id) });
  const inputClass = "min-h-10 rounded-lg border border-admin-border bg-admin-surface px-3 text-admin-ink";

  return (
    <Modal isOpen onOpenChange={(open) => { if (!open) onClose(); }}>
      <Modal.Backdrop>
        <Modal.Container size="md" placement="center" scroll="inside">
          <Modal.Dialog>
            <Modal.Header className="border-b border-admin-border px-5 py-4">
              <Modal.Heading className="text-base font-bold text-admin-ink">{announcement ? t("editTitle") : t("addTitle")}</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="grid gap-4 px-5 py-4 text-sm">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-admin-ink">{t("title")}</span>
                <input value={draft.title} maxLength={80} onChange={(event) => set({ title: event.target.value })} className={inputClass} />
                <span className="text-xs text-admin-muted">{t("titleHint")}</span>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-admin-ink">{t("message")}</span>
                <textarea value={draft.message} maxLength={500} rows={3} onChange={(event) => set({ message: event.target.value })} className={`${inputClass} py-2`} />
                <span className="text-xs text-admin-muted">{t("messageHint")}</span>
              </label>
              <fieldset className="flex flex-col gap-2">
                <legend className="text-xs font-semibold text-admin-ink">{t("branches")}</legend>
                <div className="flex flex-wrap gap-x-4 gap-y-2">
                  {(branches.data?.items ?? []).map((branch) => (
                    <label key={branch.id} className="flex items-center gap-2 text-xs text-admin-ink">
                      <input type="checkbox" className="accent-admin-accent" checked={draft.branchIds.includes(branch.id)} onChange={(event) => toggleBranch(branch.id, event.target.checked)} />
                      {branch.name}
                    </label>
                  ))}
                </div>
                <span className="text-xs text-admin-muted">{t("branchesHint")}</span>
              </fieldset>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-admin-ink">{t("startDate")}</span>
                  <input type="date" value={draft.startDate} onChange={(event) => set({ startDate: event.target.value })} className={inputClass} />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-admin-ink">{t("endDate")}</span>
                  <input type="date" value={draft.endDate} onChange={(event) => set({ endDate: event.target.value })} className={inputClass} />
                </label>
                <span className="col-span-2 text-xs text-admin-muted">{t("datesHint")}</span>
              </div>
              <label className="flex items-center gap-2 text-xs font-semibold text-admin-ink">
                <input type="checkbox" className="accent-admin-accent" checked={draft.active} onChange={(event) => set({ active: event.target.checked })} />
                {t("active")}
              </label>
              {touched && error ? <p role="alert" className="text-sm text-admin-danger">{t(`errors.${error}`)}</p> : null}
            </Modal.Body>
            <Modal.Footer className="flex justify-end gap-2 border-t border-admin-border px-5 py-3">
              <Button variant="ghost" className="rounded-lg" onPress={onClose}>{t("cancel")}</Button>
              <Button
                variant="primary"
                className="rounded-lg"
                onPress={() => {
                  setTouched(true);
                  if (error) return;
                  onDone({ ...draft, title: draft.title.trim(), message: draft.message.trim() });
                  onClose();
                }}
              >
                {t("confirm")}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
