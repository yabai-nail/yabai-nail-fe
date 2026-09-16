"use client";

import { useFormatter, useTranslations } from "next-intl";
import { PlusIcon } from "@heroicons/react/24/outline";
import { Button } from "@heroui/react";
import { useState } from "react";
import { notifySuccess } from "@/lib/app-toast";
import {
  adminService,
  useAdminCustomerNotes,
  useAdminPermission,
  type AdminCustomerNote,
} from "@/service";

// Small inline notes section for CustomerDetailPanel. Read + create + edit
// share one component because they all pivot around the same customerId
// and there's only ever one thing open at a time.
export function CustomerNotesPanel({
  branchId,
  customerId,
}: Readonly<{ branchId: string; customerId: string }>) {
  const t = useTranslations("admin.customers");
  const tc = useTranslations("admin.common");
  const format = useFormatter();
  const { data, isLoading, error, mutate } = useAdminCustomerNotes(branchId, customerId);
  const canWrite = useAdminPermission("customer.note.write.branch", "customer.note.write.assigned");
  const notes = data?.items ?? [];

  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function submitCreate() {
    const trimmed = draft.trim();
    if (!trimmed) return;
    setPending(true);
    setSubmitError(null);
    try {
      await adminService.createCustomerNote(branchId, customerId, { content: trimmed });
      notifySuccess(tc("noteCreated"));
      setDraft("");
      void mutate();
    } catch (thrown) {
      setSubmitError(
        thrown instanceof Error ? thrown.message : t("notes.saveFailed"),
      );
    } finally {
      setPending(false);
    }
  }

  async function submitEdit(note: AdminCustomerNote) {
    const trimmed = editingContent.trim();
    if (!trimmed) return;
    setPending(true);
    setSubmitError(null);
    try {
      await adminService.updateCustomerNote(
        branchId,
        customerId,
        note.id,
        { content: trimmed },
        note.version,
      );
      notifySuccess(tc("noteUpdated"));
      setEditingId(null);
      setEditingContent("");
      void mutate();
    } catch (thrown) {
      setSubmitError(
        thrown instanceof Error ? thrown.message : t("notes.updateFailed"),
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <section aria-labelledby="customer-notes-heading" className="space-y-3 border-t border-admin-border pt-3">
      <div className="flex items-center justify-between">
        <h3 id="customer-notes-heading" className="text-sm font-bold text-admin-ink">
          {t("notes.heading")}
        </h3>
      </div>

      {isLoading ? (
        <p className="text-xs text-admin-muted">{t("notes.loading")}</p>
      ) : error ? (
        <p role="alert" className="text-xs text-admin-danger">{t("notes.loadFailed")}</p>
      ) : notes.length === 0 ? (
        <p className="text-xs text-admin-muted">{t("notes.empty")}</p>
      ) : (
        <ul className="space-y-2 text-xs">
          {notes.map((note) => (
            <li key={note.id} className="rounded-lg border border-admin-border p-2">
              {editingId === note.id ? (
                <div className="space-y-2">
                  <textarea
                    value={editingContent}
                    onChange={(event) => setEditingContent(event.target.value)}
                    rows={2}
                    disabled={!canWrite}
                    className="block w-full rounded-lg border border-admin-border bg-admin-surface p-2 text-xs text-admin-ink"
                  />
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="ghost" onPress={() => setEditingId(null)} isDisabled={pending}>
                      {t("notes.cancel")}
                    </Button>
                    <Button
                      size="sm"
                      variant="primary"
                      className="rounded-lg"
                      onPress={() => void submitEdit(note)}
                      isDisabled={!canWrite || pending || editingContent.trim().length === 0}
                    >
                      {pending ? t("notes.saving") : t("notes.save")}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="whitespace-pre-line leading-4 text-admin-ink">{note.content}</p>
                    <p className="mt-1 text-[0.65rem] text-admin-muted">
                      {format.dateTime(new Date(note.updatedAt ?? note.createdAt), { dateStyle: "short", timeStyle: "short" })}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    isDisabled={!canWrite}
                    onPress={() => {
                      setEditingId(note.id);
                      setEditingContent(note.content);
                    }}
                  >
                    {t("notes.edit")}
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="space-y-2">
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          rows={2}
          disabled={!canWrite}
          placeholder={t("notes.placeholder")}
          className="block w-full rounded-lg border border-admin-border bg-admin-surface p-2 text-xs text-admin-ink"
        />
        <div className="flex justify-end">
          <Button
            size="sm"
            variant="primary"
            className="rounded-lg"
            onPress={() => void submitCreate()}
            isDisabled={!canWrite || pending || draft.trim().length === 0}
          >
            <PlusIcon className="size-3.5" />
            {t("notes.add")}
          </Button>
        </div>
        {submitError ? <p role="alert" className="text-xs text-admin-danger">{submitError}</p> : null}
      </div>
    </section>
  );
}
