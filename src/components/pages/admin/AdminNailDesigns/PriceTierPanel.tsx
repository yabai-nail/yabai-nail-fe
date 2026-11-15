"use client";

import { ExclamationTriangleIcon, PencilSquareIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { Button, Card, Modal } from "@heroui/react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { AdminSortableHeader } from "@/components/blocks/admin/AdminSortableHeader";
import { isVersionConflict } from "@/components/pages/admin/AdminMarketing/home-announcements";
import { salesOnTier } from "@/components/pages/admin/AdminSales/data";
import { formatMoney } from "@/lib/admin-format";
import { notifySuccess } from "@/lib/app-toast";
import { adminService, useAdminPermission, useAdminSales, type AdminPriceTier } from "@/service";
import { PriceTierModal } from "./PriceTierModal";

/**
 * The "Mức giá" tab: the short list of ready-made prices a design can sit on. `onChanged` runs
 * after every write, because a tier's amount or removal also changes the designs on it.
 */
export function PriceTierPanel({
  tiers,
  isLoading,
  failed,
  onChanged,
}: Readonly<{
  tiers: ReadonlyArray<AdminPriceTier>;
  isLoading: boolean;
  failed: boolean;
  onChanged: () => void;
}>) {
  const t = useTranslations("admin.nailDesigns.tiers");
  // `null` opens the form for a new tier; a tier opens it for editing.
  const [editing, setEditing] = useState<AdminPriceTier | null | undefined>(undefined);
  const [deleting, setDeleting] = useState<AdminPriceTier | null>(null);
  // After a reload (e.g. on a version conflict) a retry must send the tier's fresh version.
  const latest = (tier: AdminPriceTier) => tiers.find((item) => item.id === tier.id) ?? tier;
  const addButton = (
    <Button variant="primary" className="rounded-lg" onPress={() => setEditing(null)}>
      <PlusIcon className="size-4" />{t("add")}
    </Button>
  );

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 border-b border-admin-border pb-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-2xl text-xs leading-5 text-admin-muted">{t("description")}</p>
        {addButton}
      </div>
      {isLoading ? (
        <p className="mb-3 text-xs text-admin-muted">{t("loading")}</p>
      ) : failed ? (
        <p role="alert" className="mb-3 text-xs text-admin-danger">{t("loadFailed")}</p>
      ) : null}
      {!isLoading && !failed && tiers.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-lg border border-admin-border bg-admin-surface px-4 py-12 text-center">
          <p role="status" className="max-w-md text-sm text-admin-muted">{t("empty")}</p>
          {addButton}
        </div>
      ) : tiers.length > 0 ? (
        <Card className="min-w-0 gap-0 overflow-hidden rounded-lg border-admin-border bg-admin-surface p-0 shadow-none">
          <Card.Content className="min-w-0 overflow-x-auto p-0">
            <table className="w-full min-w-[480px] text-left text-sm">
              <caption className="sr-only">{t("caption")}</caption>
              <thead className="border-b border-admin-border bg-admin-soft/60 text-xs font-semibold text-admin-ink">
                <tr>
                  <AdminSortableHeader className="px-4">{t("columns.name")}</AdminSortableHeader>
                  <AdminSortableHeader>{t("columns.amount")}</AdminSortableHeader>
                  <AdminSortableHeader>{t("columns.designs")}</AdminSortableHeader>
                  <AdminSortableHeader>{t("columns.actions")}</AdminSortableHeader>
                </tr>
              </thead>
              <tbody className="divide-y divide-admin-border">
                {tiers.map((tier) => (
                  <tr key={tier.id}>
                    <td className="px-4 py-2 font-medium text-admin-ink">{tier.name}</td>
                    <td className="whitespace-nowrap px-3 py-2 font-semibold">{formatMoney(tier.amount)}</td>
                    <td className="whitespace-nowrap px-3 py-2 tabular-nums">{t("designCount", { count: tier.designCount })}</td>
                    <td className="whitespace-nowrap px-3 py-2">
                      <div className="flex gap-1">
                        <Button isIconOnly size="sm" variant="ghost" aria-label={t("editTier", { name: tier.name })} onPress={() => setEditing(tier)}>
                          <PencilSquareIcon className="size-4" />
                        </Button>
                        <Button isIconOnly size="sm" variant="ghost" className="text-admin-danger" aria-label={t("deleteTier", { name: tier.name })} onPress={() => setDeleting(tier)}>
                          <TrashIcon className="size-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card.Content>
        </Card>
      ) : null}

      {editing !== undefined ? <PriceTierModal tier={editing && latest(editing)} onClose={() => setEditing(undefined)} onSaved={onChanged} /> : null}
      {deleting ? <PriceTierDeleteModal tier={latest(deleting)} onClose={() => setDeleting(null)} onDeleted={onChanged} /> : null}
    </>
  );
}

/**
 * Says how many designs move to a typed price, so the owner knows no design loses its price, and
 * how many sales picking designs by this tier stop covering it.
 */
function PriceTierDeleteModal({
  tier,
  onClose,
  onDeleted,
}: Readonly<{ tier: AdminPriceTier; onClose: () => void; onDeleted: () => void }>) {
  const t = useTranslations("admin.nailDesigns.tiers");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Without the sales permission there is nothing to read, and the sales line is left out.
  const sales = useAdminSales(useAdminPermission("promotion.read.all"));
  const saleCount = salesOnTier(sales.data?.items ?? [], tier.id);

  const remove = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await adminService.deletePriceTier(tier.id, tier.version);
      notifySuccess(t("delete.success", { name: tier.name }));
      onDeleted();
      onClose();
    } catch (thrown) {
      // Changed in another tab: reload, so a retry carries the fresh version.
      const conflict = isVersionConflict(thrown);
      if (conflict) onDeleted();
      setError(conflict ? t("conflict") : t("delete.failed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal isOpen onOpenChange={(open) => { if (!open && !busy) onClose(); }}>
      <Modal.Backdrop>
        <Modal.Container size="sm" placement="center">
          <Modal.Dialog>
            <Modal.Header className="flex flex-row items-center gap-3 border-b border-admin-border px-5 py-4">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-admin-soft text-admin-danger">
                <ExclamationTriangleIcon aria-hidden className="size-5" />
              </span>
              <Modal.Heading className="text-base font-bold text-admin-ink">{t("delete.title")}</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="space-y-3 px-5 py-5 text-sm">
              <p className="leading-6 text-admin-ink">{t("delete.confirm", { name: tier.name })}</p>
              <p className="rounded-lg border border-admin-border bg-admin-soft px-3 py-2 text-xs leading-5 text-admin-muted">
                {tier.designCount > 0
                  ? t("delete.inUse", { count: tier.designCount, amount: formatMoney(tier.amount) })
                  : t("delete.unused")}
              </p>
              {saleCount > 0 ? (
                <p className="rounded-lg border border-admin-border bg-admin-soft px-3 py-2 text-xs leading-5 text-admin-muted">
                  {t("delete.sales", { count: saleCount })}
                </p>
              ) : null}
              {error ? <p role="alert" className="text-sm text-admin-danger">{error}</p> : null}
            </Modal.Body>
            <Modal.Footer className="flex justify-end gap-2 border-t border-admin-border px-5 py-3">
              <Button variant="ghost" className="rounded-lg" isDisabled={busy} onPress={onClose}>{t("delete.cancel")}</Button>
              <Button
                variant="ghost"
                className="rounded-lg bg-admin-danger text-white hover:bg-admin-danger/90"
                isDisabled={busy}
                onPress={() => void remove()}
              >
                {busy ? t("delete.deleting") : t("delete.action")}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
