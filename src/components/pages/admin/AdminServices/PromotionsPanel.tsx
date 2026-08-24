"use client";

import { PencilSquareIcon, TicketIcon } from "@heroicons/react/24/outline";
import { Button, Card, Modal } from "@heroui/react";
import { useState } from "react";
import { formatVnd } from "@/lib/admin-format";
import {
  adminService,
  useAdminPromotions,
  type AdminPromotion,
} from "@/service";

// Chain-wide promotion management. Lives beside the surcharge panel in the
// Services sidebar because promotions are a pricing/commercial concept that
// mirrors phụ thu — both adjust the amount a customer pays and both are
// org-scoped catalog config, unlike the branch-operational tabs in Settings.
export function PromotionsPanel() {
  const { data, isLoading, error, mutate } = useAdminPromotions();
  const items = data?.items ?? [];
  const [editing, setEditing] = useState<AdminPromotion | null>(null);
  const [issuing, setIssuing] = useState<AdminPromotion | null>(null);

  return (
    <Card className="gap-0 rounded-lg border-admin-border bg-admin-surface p-0 shadow-none">
      <Card.Header className="flex items-center gap-2 px-4 pt-4">
        <TicketIcon className="size-5 text-admin-accent" />
        <h2 className="font-bold">Khuyến mãi</h2>
      </Card.Header>
      <Card.Content className="p-4">
        {isLoading ? (
          <p className="text-xs text-admin-muted">Đang tải danh sách khuyến mãi…</p>
        ) : error ? (
          <p role="alert" className="text-xs text-admin-danger">Không tải được khuyến mãi.</p>
        ) : items.length === 0 ? (
          <p className="text-xs text-admin-muted">Chưa có chương trình khuyến mãi nào.</p>
        ) : (
          <ul className="space-y-1 text-xs">
            {items.map((promotion) => (
              <li
                key={promotion.id}
                className="flex items-center justify-between gap-2 rounded-lg px-2 py-1 hover:bg-admin-soft"
              >
                <span className="min-w-0 flex-1 truncate">
                  <strong className="text-admin-ink">{promotion.name}</strong>
                  <span className="ml-2 text-admin-muted">({promotion.code})</span>
                  <span className="ml-2 text-admin-muted">
                    {typeof promotion.discountVnd === "number"
                      ? formatVnd(promotion.discountVnd)
                      : typeof promotion.percentage === "number"
                        ? `${promotion.percentage}%`
                        : "—"}
                  </span>
                  <span className="ml-2 text-[0.6rem] uppercase tracking-wide text-admin-muted">{promotion.status}</span>
                </span>
                <Button
                  isIconOnly
                  size="sm"
                  variant="ghost"
                  aria-label={`Cấp phát ${promotion.name}`}
                  onPress={() => setIssuing(promotion)}
                >
                  <TicketIcon className="size-3.5" />
                </Button>
                <Button
                  isIconOnly
                  size="sm"
                  variant="ghost"
                  aria-label={`Sửa ${promotion.name}`}
                  onPress={() => setEditing(promotion)}
                >
                  <PencilSquareIcon className="size-3.5" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card.Content>

      {editing ? (
        <PromotionEditor promotion={editing} onClose={() => setEditing(null)} onSaved={() => void mutate()} />
      ) : null}
      {issuing ? (
        <PromotionIssuer promotion={issuing} onClose={() => setIssuing(null)} />
      ) : null}
    </Card>
  );
}

function PromotionEditor({
  promotion,
  onClose,
  onSaved,
}: Readonly<{
  promotion: AdminPromotion;
  onClose: () => void;
  onSaved: () => void;
}>) {
  const [name, setName] = useState(promotion.name);
  const [status, setStatus] = useState(promotion.status);
  const [kind, setKind] = useState<"FIXED" | "PERCENT">(
    typeof promotion.percentage === "number" ? "PERCENT" : "FIXED",
  );
  const [amount, setAmount] = useState(
    typeof promotion.discountVnd === "number" ? String(promotion.discountVnd) : "",
  );
  const [percent, setPercent] = useState(
    typeof promotion.percentage === "number" ? String(promotion.percentage) : "",
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const numericAmount = Number(amount.replace(/\D/g, ""));
  const numericPercent = Number(percent);
  const canSubmit =
    name.trim().length > 0 &&
    !busy &&
    (kind === "FIXED" ? numericAmount > 0 : numericPercent > 0);

  async function submit() {
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    try {
      await adminService.updatePromotion(
        promotion.id,
        {
          name: name.trim(),
          status,
          ...(kind === "FIXED"
            ? { discountVnd: numericAmount, percentage: undefined }
            : { percentage: numericPercent, discountVnd: undefined }),
        },
        promotion.version,
      );
      onSaved();
      onClose();
    } catch (thrown) {
      setError(thrown instanceof Error ? thrown.message : "Không lưu được khuyến mãi.");
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
              <Modal.Heading className="text-base font-bold text-admin-ink">Sửa khuyến mãi</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="grid gap-3 px-5 py-4 text-sm">
              <div className="rounded-lg bg-admin-soft px-3 py-2 text-xs text-admin-muted">Mã: <strong className="text-admin-ink">{promotion.code}</strong></div>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-admin-ink">Tên chương trình</span>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="min-h-10 rounded-lg border border-admin-border bg-admin-surface px-3 text-admin-ink"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-admin-ink">Trạng thái</span>
                <select
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                  className="min-h-10 rounded-lg border border-admin-border bg-admin-surface px-3 text-admin-ink"
                >
                  <option value="ACTIVE">Đang chạy</option>
                  <option value="PAUSED">Tạm dừng</option>
                  <option value="ARCHIVED">Lưu trữ</option>
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-admin-ink">Kiểu giảm</span>
                <select
                  value={kind}
                  onChange={(event) => setKind(event.target.value as typeof kind)}
                  className="min-h-10 rounded-lg border border-admin-border bg-admin-surface px-3 text-admin-ink"
                >
                  <option value="FIXED">Số tiền cố định</option>
                  <option value="PERCENT">Phần trăm</option>
                </select>
              </label>
              {kind === "FIXED" ? (
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-admin-ink">Số tiền giảm (VND)</span>
                  <input
                    inputMode="numeric"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    className="min-h-10 rounded-lg border border-admin-border bg-admin-surface px-3 text-admin-ink"
                  />
                </label>
              ) : (
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-admin-ink">Phần trăm giảm</span>
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
              {error ? <p role="alert" className="text-xs text-admin-danger">{error}</p> : null}
            </Modal.Body>
            <Modal.Footer className="flex justify-end gap-2 border-t border-admin-border px-5 py-3">
              <Button variant="ghost" className="rounded-lg" onPress={onClose} isDisabled={busy}>Huỷ</Button>
              <Button
                variant="primary"
                className="rounded-lg"
                onPress={() => void submit()}
                isDisabled={!canSubmit}
              >
                {busy ? "Đang lưu…" : "Lưu"}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

function PromotionIssuer({
  promotion,
  onClose,
}: Readonly<{ promotion: AdminPromotion; onClose: () => void }>) {
  const [raw, setRaw] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const customerIds = raw
    .split(/[\s,;]+/)
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
  const canSubmit = customerIds.length > 0 && !busy;

  async function submit() {
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const issuance = await adminService.issuePromotion(promotion.id, {
        customerIds,
        ...(note.trim() ? { note: note.trim() } : {}),
      });
      setResult(`Đã cấp: ${issuance.issuedCount} · Lỗi: ${issuance.failedCount}`);
    } catch (thrown) {
      setError(thrown instanceof Error ? thrown.message : "Không cấp phát được khuyến mãi.");
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
              <Modal.Heading className="text-base font-bold text-admin-ink">Cấp phát khuyến mãi</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="grid gap-3 px-5 py-4 text-sm">
              <div className="rounded-lg bg-admin-soft px-3 py-2 text-xs text-admin-muted">
                {promotion.name} <strong className="text-admin-ink">({promotion.code})</strong>
              </div>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-admin-ink">Mã khách hàng</span>
                <textarea
                  value={raw}
                  onChange={(event) => setRaw(event.target.value)}
                  rows={4}
                  placeholder="Dán danh sách ID khách, cách nhau bằng dấu phẩy hoặc xuống dòng"
                  className="rounded-lg border border-admin-border bg-admin-surface px-3 py-2 text-admin-ink"
                />
                <span className="text-[0.7rem] text-admin-muted">Đã nhận diện {customerIds.length} khách.</span>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-admin-ink">Ghi chú (tuỳ chọn)</span>
                <input
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  className="min-h-10 rounded-lg border border-admin-border bg-admin-surface px-3 text-admin-ink"
                />
              </label>
              {error ? <p role="alert" className="text-xs text-admin-danger">{error}</p> : null}
              {result ? <p className="rounded-lg bg-admin-soft px-3 py-2 text-xs text-admin-ink">{result}</p> : null}
            </Modal.Body>
            <Modal.Footer className="flex justify-end gap-2 border-t border-admin-border px-5 py-3">
              <Button variant="ghost" className="rounded-lg" onPress={onClose} isDisabled={busy}>Đóng</Button>
              <Button
                variant="primary"
                className="rounded-lg"
                onPress={() => void submit()}
                isDisabled={!canSubmit}
              >
                {busy ? "Đang cấp phát…" : "Cấp phát"}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
