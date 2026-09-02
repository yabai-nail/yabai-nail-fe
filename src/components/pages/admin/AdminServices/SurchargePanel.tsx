"use client";

import { useTranslations } from "next-intl";
import { PencilSquareIcon, PlusIcon } from "@heroicons/react/24/outline";
import { Button, Card, Modal } from "@heroui/react";
import { useState } from "react";
import { formatMoney } from "@/lib/admin-format";
import { notifySuccess } from "@/lib/app-toast";
import {
  adminService,
  useAdminSurcharges,
  type AdminSurcharge,
} from "@/service";
import { AdminSelectField } from "@/components/blocks/admin/AdminSelectField";

// Compact org-scope surcharge management. Same-file editor mirrors the
// pattern from CategoryEditor: one modal covers create + edit.
export function SurchargePanel() {
  const t = useTranslations("admin.services");
  const { data, isLoading, error, mutate } = useAdminSurcharges();
  const items = data?.items ?? [];
  const [editing, setEditing] = useState<AdminSurcharge | null>(null);
  const [creating, setCreating] = useState(false);

  return (
    <Card className="gap-0 rounded-lg border-admin-border bg-admin-surface p-0 shadow-none">
      <Card.Header className="flex flex-row items-center justify-between px-4 pt-4">
        <h2 className="font-bold">{t("surcharge.heading")}</h2>
        <Button
          isIconOnly
          size="sm"
          variant="ghost"
          aria-label={t("surcharge.add")}
          onPress={() => setCreating(true)}
        >
          <PlusIcon className="size-4" />
        </Button>
      </Card.Header>
      <Card.Content className="p-4">
        {isLoading ? (
          <p className="text-xs text-admin-muted">{t("surcharge.loading")}</p>
        ) : error ? (
          <p role="alert" className="text-xs text-admin-danger">{t("surcharge.loadFailed")}</p>
        ) : items.length === 0 ? (
          <p className="text-xs text-admin-muted">{t("surcharge.empty")}</p>
        ) : (
          <ul className="space-y-1 text-xs">
            {items.map((surcharge) => (
              <li
                key={surcharge.id}
                className="flex items-center justify-between gap-2 rounded-lg px-2 py-1 hover:bg-admin-soft"
              >
                <span className="min-w-0 flex-1 truncate">
                  <strong className="text-admin-ink">{surcharge.name}</strong>
                  <span className="ml-2 text-admin-muted">
                    {typeof surcharge.amount === "number"
                      ? formatMoney(surcharge.amount)
                      : typeof surcharge.percent === "number"
                        ? `${surcharge.percent}%`
                        : "—"}
                  </span>
                </span>
                <Button
                  isIconOnly
                  size="sm"
                  variant="ghost"
                  aria-label={t("surcharge.editOne", { name: surcharge.name })}
                  onPress={() => setEditing(surcharge)}
                >
                  <PencilSquareIcon className="size-3.5" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card.Content>

      {(creating || editing) ? (
        <SurchargeEditor
          surcharge={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSaved={() => void mutate()}
        />
      ) : null}
    </Card>
  );
}

function SurchargeEditor({
  surcharge,
  onClose,
  onSaved,
}: Readonly<{
  surcharge: AdminSurcharge | null;
  onClose: () => void;
  onSaved: () => void;
}>) {
  const t = useTranslations("admin.services");
  const isEdit = surcharge !== null;
  const [code, setCode] = useState(
    typeof surcharge?.code === "string" ? surcharge.code : "",
  );
  const [name, setName] = useState(surcharge?.name ?? "");
  const [kind, setKind] = useState<"FIXED" | "PERCENT">(
    surcharge?.type === "PERCENT" ? "PERCENT" : "FIXED",
  );
  const [amount, setAmount] = useState(
    typeof surcharge?.amount === "number" ? String(surcharge.amount) : "",
  );
  const [percent, setPercent] = useState(
    typeof surcharge?.percent === "number" ? String(surcharge.percent) : "",
  );
  const [active, setActive] = useState(surcharge ? surcharge.status === "ACTIVE" : true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const numericAmount = Number(amount.replace(/\D/g, ""));
  const numericPercent = Number(percent);
  const canSubmit =
    code.trim().length > 0 &&
    name.trim().length > 0 &&
    !busy &&
    (kind === "FIXED" ? numericAmount > 0 : numericPercent > 0);

  async function submit() {
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    // Field names the backend actually reads. The form used to send
    // { name, kind, active, percentage } and omit code entirely, so every save
    // failed with "Thong tin phu thu khong hop le." — code is required, and
    // kind/active/percentage are read as type/status/percent.
    const payload = {
      code: code.trim().toUpperCase(),
      name: name.trim(),
      type: kind,
      status: (active ? "ACTIVE" : "INACTIVE") as "ACTIVE" | "INACTIVE",
      ...(kind === "FIXED" ? { amount: numericAmount } : { percent: numericPercent }),
    };
    try {
      if (isEdit) {
        await adminService.updateSurcharge(surcharge.id, payload, surcharge.version);
      } else {
        await adminService.createSurcharge(payload);
      }
      notifySuccess(isEdit ? "Đã cập nhật phụ thu" : "Đã thêm phụ thu");
      onSaved();
      onClose();
    } catch (thrown) {
      setError(thrown instanceof Error ? thrown.message : t("surcharge.saveFailed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal isOpen onOpenChange={(open) => { if (!open) onClose(); }}>
      <Modal.Backdrop>
        <Modal.Container size="sm" placement="center" scroll="inside">
          <Modal.Dialog>
            <Modal.Header className="border-b border-admin-border px-5 py-4">
              <Modal.Heading className="text-base font-bold text-admin-ink">
                {isEdit ? t("surcharge.editTitle") : t("surcharge.addTitle")}
              </Modal.Heading>
            </Modal.Header>
            <Modal.Body className="grid gap-3 px-5 py-4 text-sm">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-admin-ink">{t("surcharge.code")}</span>
                <input
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  placeholder="WEEKEND"
                  disabled={isEdit}
                  className="min-h-10 rounded-lg border border-admin-border bg-admin-surface px-3 text-admin-ink disabled:opacity-60"
                />
                <span className="text-admin-muted">
                  {isEdit ? t("surcharge.codeLocked") : t("surcharge.codeHint")}
                </span>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-admin-ink">{t("surcharge.name")}</span>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="min-h-10 rounded-lg border border-admin-border bg-admin-surface px-3 text-admin-ink"
                />
              </label>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-admin-ink">{t("surcharge.kind")}</span>
                <AdminSelectField
                  label={t("surcharge.kindLabel")}
                  fullWidth
                  value={kind}
                  onChange={(value) => setKind(value as typeof kind)}
                  options={[
                    { value: "FIXED", label: t("surcharge.fixed") },
                    { value: "PERCENT", label: t("surcharge.percent") },
                  ]}
                />
              </div>
              {kind === "FIXED" ? (
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-admin-ink">{t("surcharge.amount")}</span>
                  <input
                    inputMode="numeric"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    className="min-h-10 rounded-lg border border-admin-border bg-admin-surface px-3 text-admin-ink"
                  />
                </label>
              ) : (
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-admin-ink">{t("surcharge.percent")}</span>
                  <input
                    type="number"
                    min={0}
                    step={0.5}
                    value={percent}
                    onChange={(event) => setPercent(event.target.value)}
                    className="min-h-10 rounded-lg border border-admin-border bg-admin-surface px-3 text-admin-ink"
                  />
                </label>
              )}
              <label className="flex items-center gap-2 text-xs text-admin-ink">
                <input
                  type="checkbox" className="accent-admin-accent"
                  checked={active}
                  onChange={(event) => setActive(event.target.checked)}
                />
                Đang áp dụng
              </label>
              {error ? <p role="alert" className="text-xs text-admin-danger">{error}</p> : null}
            </Modal.Body>
            <Modal.Footer className="flex justify-end gap-2 border-t border-admin-border px-5 py-3">
              <Button variant="ghost" className="rounded-lg" onPress={onClose} isDisabled={busy}>{t("surcharge.cancel")}</Button>
              <Button
                variant="primary"
                className="rounded-lg"
                onPress={() => void submit()}
                isDisabled={!canSubmit}
              >
                {busy ? t("surcharge.saving") : isEdit ? t("surcharge.save") : t("surcharge.addAction")}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
