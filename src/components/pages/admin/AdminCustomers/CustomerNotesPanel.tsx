"use client";

import { PlusIcon } from "@heroicons/react/24/outline";
import { Button } from "@heroui/react";
import { useState } from "react";
import {
  adminService,
  useAdminCustomerNotes,
  type AdminCustomerNote,
} from "@/service";

// Small inline notes section for CustomerDetailPanel. Read + create + edit
// share one component because they all pivot around the same customerId
// and there's only ever one thing open at a time.
export function CustomerNotesPanel({
  branchId,
  customerId,
}: Readonly<{ branchId: string; customerId: string }>) {
  const { data, isLoading, error, mutate } = useAdminCustomerNotes(branchId, customerId);
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
      setDraft("");
      void mutate();
    } catch (thrown) {
      setSubmitError(
        thrown instanceof Error ? thrown.message : "Không lưu được ghi chú.",
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
      setEditingId(null);
      setEditingContent("");
      void mutate();
    } catch (thrown) {
      setSubmitError(
        thrown instanceof Error ? thrown.message : "Không cập nhật được ghi chú.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <section aria-labelledby="customer-notes-heading" className="space-y-3 border-t border-admin-border pt-3">
      <div className="flex items-center justify-between">
        <h3 id="customer-notes-heading" className="text-sm font-bold text-admin-ink">
          Ghi chú nhân viên
        </h3>
      </div>

      {isLoading ? (
        <p className="text-xs text-admin-muted">Đang tải ghi chú…</p>
      ) : error ? (
        <p role="alert" className="text-xs text-admin-danger">Không tải được ghi chú.</p>
      ) : notes.length === 0 ? (
        <p className="text-xs text-admin-muted">Chưa có ghi chú nào.</p>
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
                    className="block w-full rounded-lg border border-admin-border bg-admin-surface p-2 text-xs text-admin-ink"
                  />
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="ghost" onPress={() => setEditingId(null)} isDisabled={pending}>
                      Huỷ
                    </Button>
                    <Button
                      size="sm"
                      variant="primary"
                      className="rounded-lg"
                      onPress={() => void submitEdit(note)}
                      isDisabled={pending || editingContent.trim().length === 0}
                    >
                      {pending ? "Đang lưu…" : "Lưu"}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="whitespace-pre-line leading-4 text-admin-ink">{note.content}</p>
                    <p className="mt-1 text-[0.65rem] text-admin-muted">
                      {new Date(note.updatedAt ?? note.createdAt).toLocaleString("vi-VN")}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onPress={() => {
                      setEditingId(note.id);
                      setEditingContent(note.content);
                    }}
                  >
                    Sửa
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
          placeholder="Thêm ghi chú nội bộ (không hiển thị cho khách)…"
          className="block w-full rounded-lg border border-admin-border bg-admin-surface p-2 text-xs text-admin-ink"
        />
        <div className="flex justify-end">
          <Button
            size="sm"
            variant="primary"
            className="rounded-lg"
            onPress={() => void submitCreate()}
            isDisabled={pending || draft.trim().length === 0}
          >
            <PlusIcon className="size-3.5" />
            Thêm ghi chú
          </Button>
        </div>
        {submitError ? <p role="alert" className="text-xs text-admin-danger">{submitError}</p> : null}
      </div>
    </section>
  );
}
