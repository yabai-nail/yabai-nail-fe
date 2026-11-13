"use client";

import { Button, Modal } from "@heroui/react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { parseWholeYen } from "@/lib/admin-format";
import { notifySuccess } from "@/lib/app-toast";
import { adminService, ApiClientError, type AdminPriceTier } from "@/service";

const inputClass = "min-h-10 rounded-lg border bg-admin-surface px-3 text-admin-ink";
type Field = "name" | "amount";

/** The API's `PRICE_TIER_INVALID` names the field it refused; anything else is a general failure. */
function refusedField(thrown: unknown): Field | null {
  if (!(thrown instanceof ApiClientError) || thrown.code !== "PRICE_TIER_INVALID") return null;
  const field = (thrown.details as { field?: unknown } | undefined)?.field;
  return field === "name" || field === "amount" ? field : null;
}

/** Add a price tier, or edit one (`tier` set). Same rules as the API: name 1–60, whole yen ≥ 1. */
export function PriceTierModal({
  tier,
  onClose,
  onSaved,
}: Readonly<{ tier: AdminPriceTier | null; onClose: () => void; onSaved: () => void }>) {
  const t = useTranslations("admin.nailDesigns.tiers.modal");
  const [name, setName] = useState(tier?.name ?? "");
  const [amount, setAmount] = useState(tier ? String(tier.amount) : "");
  const [touched, setTouched] = useState<ReadonlySet<Field>>(new Set());
  const [serverField, setServerField] = useState<Field | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const trimmed = name.trim();
  const parsedAmount = parseWholeYen(amount);
  const nameValid = trimmed.length >= 1 && trimmed.length <= 60;
  const amountValid = parsedAmount !== null && parsedAmount >= 1;
  const showNameError = serverField === "name" || (touched.has("name") && !nameValid);
  const showAmountError = serverField === "amount" || (touched.has("amount") && !amountValid);
  const touch = (field: Field) => setTouched((current) => new Set(current).add(field));

  const submit = async () => {
    setTouched(new Set<Field>(["name", "amount"]));
    if (!nameValid || !amountValid || busy) return;
    setBusy(true);
    setError(null);
    setServerField(null);
    try {
      const input = { name: trimmed, amount: parsedAmount };
      if (tier) await adminService.updatePriceTier(tier.id, input, tier.version);
      else await adminService.createPriceTier(input);
      notifySuccess(t(tier ? "updated" : "created", { name: trimmed }));
      onSaved();
      onClose();
    } catch (thrown) {
      const field = refusedField(thrown);
      setServerField(field);
      setError(field ? null : t("saveFailed"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal isOpen onOpenChange={(open) => { if (!open && !busy) onClose(); }}>
      <Modal.Backdrop>
        <Modal.Container size="sm" placement="center">
          <Modal.Dialog>
            <Modal.Header className="border-b border-admin-border px-5 py-4">
              <Modal.Heading className="text-base font-bold text-admin-ink">
                {t(tier ? "editTitle" : "addTitle")}
              </Modal.Heading>
            </Modal.Header>
            <form
              noValidate
              className="contents"
              onSubmit={(event) => { event.preventDefault(); void submit(); }}
            >
              <Modal.Body className="grid gap-4 px-5 py-5">
                <label className="flex flex-col gap-2 text-sm">
                  <span className="font-semibold text-admin-ink">{t("name")}</span>
                  <input
                    className={`${inputClass} ${showNameError ? "border-admin-danger" : "border-admin-border"}`}
                    value={name}
                    maxLength={60}
                    onChange={(event) => { setName(event.target.value); if (serverField === "name") setServerField(null); }}
                    onBlur={() => touch("name")}
                    placeholder={t("namePlaceholder")}
                    aria-invalid={showNameError}
                    autoFocus
                  />
                  {showNameError ? <span className="text-xs text-admin-danger">{t("nameInvalid")}</span> : null}
                </label>
                <label className="flex flex-col gap-2 text-sm">
                  <span className="font-semibold text-admin-ink">{t("amount")}</span>
                  <input
                    inputMode="numeric"
                    className={`${inputClass} ${showAmountError ? "border-admin-danger" : "border-admin-border"}`}
                    value={amount}
                    onChange={(event) => { setAmount(event.target.value); if (serverField === "amount") setServerField(null); }}
                    onBlur={() => touch("amount")}
                    placeholder={t("amountPlaceholder")}
                    aria-invalid={showAmountError}
                  />
                  {/* The hint is about designs already on the tier, so a new tier has none. */}
                  {showAmountError || tier ? (
                    <span className={showAmountError ? "text-xs text-admin-danger" : "text-xs text-admin-muted"}>
                      {t(showAmountError ? "amountInvalid" : "amountHint")}
                    </span>
                  ) : null}
                </label>
                {error ? <p role="alert" className="text-sm text-admin-danger">{error}</p> : null}
              </Modal.Body>
              <Modal.Footer className="flex justify-end gap-2 border-t border-admin-border px-5 py-3">
                <Button variant="ghost" className="rounded-lg" isDisabled={busy} onPress={onClose}>{t("cancel")}</Button>
                <Button type="submit" variant="primary" className="rounded-lg" isDisabled={busy}>
                  {busy ? t("saving") : t(tier ? "save" : "add")}
                </Button>
              </Modal.Footer>
            </form>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
