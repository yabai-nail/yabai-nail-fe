"use client";

import { Button, Modal } from "@heroui/react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { adminService, type AdminNailDesignProposal } from "@/service";

export function ProposalReviewModal({ proposal, decision, onClose, onSaved }: Readonly<{
  proposal: AdminNailDesignProposal;
  decision: "APPROVE" | "REJECT";
  onClose: () => void;
  onSaved: () => void;
}>) {
  const t = useTranslations("admin.nailDesigns.proposals");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canSubmit = decision === "APPROVE" || reason.trim().length >= 2;

  const submit = async () => {
    if (!canSubmit || busy) return;
    setBusy(true);
    setError(null);
    try {
      await adminService.decideNailDesignProposal(
        proposal.proposalId,
        { decision, ...(reason.trim() ? { reason: reason.trim() } : {}) },
        proposal.version,
      );
      onSaved();
      onClose();
    } catch (thrown) {
      setError(thrown instanceof Error ? thrown.message : t("saveFailed"));
    } finally {
      setBusy(false);
    }
  };

  return <Modal isOpen onOpenChange={(open) => { if (!open && !busy) onClose(); }}><Modal.Backdrop><Modal.Container size="sm" placement="center"><Modal.Dialog>
    <Modal.Header className="border-b border-admin-border px-5 py-4"><Modal.Heading className="text-base font-bold text-admin-ink">{decision === "APPROVE" ? t("approveTitle") : t("rejectTitle")}</Modal.Heading></Modal.Header>
    <Modal.Body className="space-y-4 px-5 py-5">
      <label className="block text-sm font-semibold text-admin-ink">{t("reason")}<textarea className="mt-2 min-h-24 w-full rounded-lg border border-admin-border bg-admin-surface px-3 py-2 text-sm font-normal outline-none focus:border-admin-accent focus:ring-2 focus:ring-admin-accent/20" value={reason} maxLength={500} required={decision === "REJECT"} onChange={(event) => setReason(event.target.value)} placeholder={decision === "REJECT" ? t("rejectReasonPlaceholder") : t("approveReasonPlaceholder")} /></label>
      {error ? <p role="alert" className="text-sm text-admin-danger">{error}</p> : null}
    </Modal.Body>
    <Modal.Footer className="border-t border-admin-border px-5 py-3"><Button variant="ghost" isDisabled={busy} onPress={onClose}>{t("cancel")}</Button><Button variant="primary" isDisabled={!canSubmit || busy} onPress={() => void submit()}>{busy ? t("saving") : decision === "APPROVE" ? t("approve") : t("reject")}</Button></Modal.Footer>
  </Modal.Dialog></Modal.Container></Modal.Backdrop></Modal>;
}
