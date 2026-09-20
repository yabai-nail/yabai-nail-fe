"use client";

import { Avatar, Button, Modal } from "@heroui/react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { PaymentCustomerSnapshot } from "./data";

export function PaymentReviewDialog({ customer, onClose, onSubmit }: Readonly<{
  customer: PaymentCustomerSnapshot;
  onClose: () => void;
  onSubmit: (input: { rating: number; comment: string }) => Promise<void>;
}>) {
  const t = useTranslations("admin.payments.review");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canSubmit = rating >= 1 && comment.trim().length > 0 && !busy;

  async function submit() {
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    try {
      await onSubmit({ rating, comment: comment.trim() });
    } catch (thrown) {
      setError(thrown instanceof Error && thrown.message ? thrown.message : t("submitFailed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal isOpen onOpenChange={(open) => { if (!open && !busy) onClose(); }}>
      <Modal.Backdrop>
        <Modal.Container size="md" placement="center" scroll="inside">
          <Modal.Dialog>
            <Modal.Header className="border-b border-admin-border px-5 py-4">
              <Modal.Heading className="text-base font-bold text-admin-ink">{t("title")}</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="space-y-5 px-5 py-5">
              <div className="flex items-center gap-3">
                <Avatar size="lg" color="accent">
                  {customer.avatarUrl ? <Avatar.Image src={customer.avatarUrl} alt={customer.name} className="object-cover" /> : null}
                  <Avatar.Fallback>{customer.initials}</Avatar.Fallback>
                </Avatar>
                <div><p className="font-semibold text-admin-ink">{customer.name}</p><p className="text-xs text-admin-muted">{t("customer")}</p></div>
              </div>
              <fieldset>
                <legend className="mb-2 text-sm font-semibold text-admin-ink">{t("rating")}</legend>
                <div className="flex gap-1" aria-label={t("rating")}>
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      type="button"
                      className={`min-h-11 min-w-11 rounded-md text-2xl ${value <= rating ? "text-amber-500" : "text-admin-muted"}`}
                      aria-label={t("star", { count: value })}
                      aria-pressed={rating === value}
                      onClick={() => setRating(value)}
                    >{"\u2605"}</button>
                  ))}
                </div>
              </fieldset>
              <label htmlFor="counter-review-comment" className="block text-sm font-semibold text-admin-ink">
                {t("comment")}
                <textarea
                  id="counter-review-comment"
                  className="mt-2 min-h-28 w-full rounded-lg border border-admin-border bg-admin-surface px-3 py-2 font-normal text-admin-ink outline-none focus:border-admin-accent focus:ring-2 focus:ring-admin-accent/20"
                  maxLength={1000}
                  required
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  placeholder={t("placeholder")}
                />
              </label>
              <p className="rounded-lg bg-admin-soft p-3 text-xs leading-5 text-admin-muted">{t("publicationNote")}</p>
              {error ? <p role="alert" className="text-sm text-admin-danger">{error}</p> : null}
            </Modal.Body>
            <Modal.Footer className="border-t border-admin-border px-5 py-4">
              <Button variant="ghost" className="rounded-lg" isDisabled={busy} onPress={onClose}>{t("skip")}</Button>
              <Button variant="primary" className="rounded-lg" isDisabled={!canSubmit} onPress={() => void submit()}>{busy ? t("submitting") : t("submit")}</Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
