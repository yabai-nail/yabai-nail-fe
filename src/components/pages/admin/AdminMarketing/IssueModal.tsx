"use client";

import { useTranslations } from "next-intl";
import { Button, Modal } from "@heroui/react";
import { useMemo, useState } from "react";

import { adminService, useAdminBranch, useAdminCustomers } from "@/service";
import { notifySuccess } from "@/lib/app-toast";

export function IssueModal({
  promotionId,
  promotionName,
  onClose,
  onIssued,
}: Readonly<{
  promotionId: string;
  promotionName: string;
  onClose: () => void;
  onIssued: () => void;
}>) {
  const t = useTranslations("admin.marketing");
  const { branchId } = useAdminBranch();
  const { data, isLoading } = useAdminCustomers(branchId);
  const [selected, setSelected] = useState<ReadonlyArray<string>>([]);
  const [query, setQuery] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const customers = useMemo(() => {
    const rows = data?.items ?? [];
    const term = query.trim().toLocaleLowerCase();
    if (!term) return rows;
    return rows.filter((row) => {
      const name = String(row.displayName ?? row.name ?? "").toLocaleLowerCase();
      return name.includes(term) || String(row.phone ?? "").includes(term);
    });
  }, [data, query]);

  const canSubmit = selected.length > 0 && !busy;

  const toggle = (id: string) =>
    setSelected((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id],
    );

  const submit = async () => {
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    try {
      await adminService.issuePromotion(promotionId, {
        customerIds: [...selected],
        note: note.trim() || undefined,
      });
      notifySuccess("Đã phát hành khuyến mãi", `Đã gửi cho ${selected.length} khách hàng.`);
      onIssued();
      onClose();
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : t("issueModal.failed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal isOpen onOpenChange={(open) => { if (!open) onClose(); }}>
      <Modal.Backdrop>
        <Modal.Container size="md" placement="center" scroll="inside">
          <Modal.Dialog>
            <Modal.Header className="border-b border-admin-border px-5 py-4">
              <Modal.Heading className="text-base font-bold text-admin-ink">
                Phát hành — {promotionName}
              </Modal.Heading>
            </Modal.Header>
            <Modal.Body className="grid gap-4 px-5 py-5">
              {/* Chosen from the branch's own customer list. Asking an operator to
                  paste raw UUIDs made a routine action depend on data no admin
                  screen shows, and a mistyped id fails as a plain 409. */}
              <label className="flex flex-col gap-2 text-sm">
                <span className="font-semibold text-admin-ink">{t("issueModal.pickCustomer")}</span>
                <input
                  className="min-h-10 rounded-lg border border-admin-border bg-admin-surface px-3 text-admin-ink"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={t("issueModal.searchPlaceholder")}
                  autoFocus
                />
              </label>
              <div className="max-h-56 overflow-y-auto rounded-lg border border-admin-border">
                {isLoading ? (
                  <p className="px-3 py-4 text-sm text-admin-muted">{t("issueModal.loading")}</p>
                ) : customers.length === 0 ? (
                  <p className="px-3 py-4 text-sm text-admin-muted">{t("issueModal.empty")}</p>
                ) : (
                  customers.map((row) => (
                    <label key={row.id} className="flex cursor-pointer items-center gap-3 border-b border-admin-border px-3 py-2 text-sm last:border-0">
                      <input
                        type="checkbox" className="accent-admin-accent"
                        checked={selected.includes(row.id)}
                        onChange={() => toggle(row.id)}
                      />
                      <span className="text-admin-ink">{row.displayName ?? row.name ?? t("issueModal.unnamed")}</span>
                      <span className="ml-auto text-xs text-admin-muted">{row.phone ?? ""}</span>
                    </label>
                  ))
                )}
              </div>
              <span className="text-xs text-admin-muted">{selected.length} khách được chọn</span>
              <label className="flex flex-col gap-2 text-sm">
                <span className="font-semibold text-admin-ink">{t("issueModal.note")}</span>
                <input
                  className="min-h-10 rounded-lg border border-admin-border bg-admin-surface px-3 text-admin-ink"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                />
              </label>
              {error ? <p className="text-sm text-admin-danger" role="alert">{error}</p> : null}
            </Modal.Body>
            <Modal.Footer className="flex justify-end gap-2 border-t border-admin-border px-5 py-3">
              <Button variant="ghost" className="rounded-lg" onPress={onClose}>{t("issueModal.cancel")}</Button>
              <Button variant="primary" className="rounded-lg" isDisabled={!canSubmit} onPress={() => void submit()}>
                {busy ? t("issueModal.busy") : t("issueModal.submit")}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
