"use client";

import { Button, Modal } from "@heroui/react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { formatMoney } from "@/lib/admin-format";
import { notifySuccess } from "@/lib/app-toast";
import { SALES_PAYMENT_METHODS, SALES_PLATFORMS, type SalesPlatform } from "@/lib/sales-report-engine";
import { todayAtSalon } from "@/lib/salon-date";
import { adminService, useAdminSalesReportPreview, type AdminSalesReport, type AdminSalesReportInput } from "@/service";
import { reportErrorKey } from "./data";

const inputClass = "min-h-11 rounded-lg border border-admin-border bg-admin-surface px-3 text-base text-admin-ink";

function digits(value: string): number | null {
  const cleaned = value.replace(/[^\d]/g, "");
  return cleaned === "" ? null : Number(cleaned);
}

/**
 * One customer's report, added or edited. The figures shown before saving come from the API's
 * preview (it knows the technician's rate for that day); the API prices the report again on
 * save, so what the screen shows and what is stored can never differ.
 *
 * The same form serves a technician reporting for themselves (`staffOptions` empty) and a
 * manager reporting on someone's behalf.
 */
export function ReportModal({
  report,
  staffOptions,
  timeZone,
  onClose,
  onSaved,
}: Readonly<{
  report: AdminSalesReport | null;
  /** Technicians the caller may report for; empty when the caller reports for their own profile only. */
  staffOptions: ReadonlyArray<{ readonly id: string; readonly name: string }>;
  timeZone?: string;
  onClose: () => void;
  onSaved: (saved: AdminSalesReport) => void;
}>) {
  const t = useTranslations("admin.salesReports.modal");
  const tl = useTranslations("admin.salesReports");
  const isEdit = report !== null;
  const canPickStaff = staffOptions.length > 0;
  const [staffId, setStaffId] = useState(report?.staffId ?? (canPickStaff ? "me" : ""));
  const [reportDate, setReportDate] = useState(report?.reportDate ?? todayAtSalon(timeZone));
  const [servedAt, setServedAt] = useState(report?.servedAt ?? "");
  const [platform, setPlatform] = useState<SalesPlatform>(report?.platform ?? "NAILIE_NEW");
  const [coursePrice, setCoursePrice] = useState(report ? String(report.coursePrice) : "");
  const [accessoryAmount, setAccessoryAmount] = useState(report ? String(report.accessoryAmount) : "");
  const [paymentMethod, setPaymentMethod] = useState(report?.paymentMethod ?? "CASH");
  const [note, setNote] = useState(report?.note ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const course = digits(coursePrice);
  const accessories = digits(accessoryAmount) ?? 0;
  const complete = course !== null && reportDate !== "" && (!canPickStaff || staffId !== "");
  const preview = useAdminSalesReportPreview(
    complete
      ? {
          ...(canPickStaff ? { staffId: isEdit ? report.staffId : staffId } : {}),
          reportDate,
          platform,
          coursePrice: course,
          accessoryAmount: accessories,
          paymentMethod,
        }
      : null,
  );

  const explain = (thrown: unknown, fallback: string): string => {
    const key = reportErrorKey(thrown);
    if (key) return tl(`errors.${key}`);
    return thrown instanceof Error && thrown.message ? thrown.message : fallback;
  };

  const submit = async () => {
    if (!complete || busy) return;
    setBusy(true);
    setError(null);
    try {
      const draft: AdminSalesReportInput = {
        ...(canPickStaff && !isEdit ? { staffId } : {}),
        reportDate,
        servedAt: servedAt || null,
        platform,
        coursePrice: course,
        accessoryAmount: accessories,
        paymentMethod,
        note: note.trim(),
      };
      const saved = isEdit
        ? await adminService.updateSalesReport(report.id, draft, report.version)
        : await adminService.createSalesReport(draft);
      notifySuccess(isEdit ? t("updated") : t("created"));
      onSaved(saved);
      onClose();
    } catch (thrown) {
      setError(explain(thrown, t("saveFailed")));
    } finally {
      setBusy(false);
    }
  };

  const choice = (active: boolean) =>
    `min-h-11 rounded-lg border px-3 text-sm font-semibold ${active ? "border-admin-accent bg-admin-accent text-white" : "border-admin-border bg-admin-surface text-admin-ink"}`;

  return (
    <Modal isOpen onOpenChange={(open) => { if (!open && !busy) onClose(); }}>
      <Modal.Backdrop>
        <Modal.Container size="md" placement="center" scroll="inside">
          <Modal.Dialog>
            <Modal.Header className="border-b border-admin-border px-5 py-4">
              <Modal.Heading className="text-base font-bold text-admin-ink">{isEdit ? t("editTitle") : t("addTitle")}</Modal.Heading>
            </Modal.Header>
            <Modal.Body className="grid gap-4 px-5 py-4 text-sm">
              {canPickStaff && !isEdit ? (
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-admin-ink">{t("staff")}</span>
                  <select value={staffId} onChange={(event) => setStaffId(event.target.value)} className={inputClass}>
                    <option value="me">{t("me")}</option>
                    {staffOptions.map((option) => (
                      <option key={option.id} value={option.id}>{option.name}</option>
                    ))}
                  </select>
                </label>
              ) : null}
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-admin-ink">{t("date")}</span>
                  <input type="date" value={reportDate} onChange={(event) => setReportDate(event.target.value)} className={inputClass} />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-admin-ink">{t("time")}</span>
                  <input type="time" value={servedAt} onChange={(event) => setServedAt(event.target.value)} className={inputClass} />
                </label>
              </div>
              <fieldset className="flex flex-col gap-2">
                <legend className="text-xs font-semibold text-admin-ink">{t("platform")}</legend>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {SALES_PLATFORMS.map((code) => (
                    <button key={code} type="button" className={choice(platform === code)} aria-pressed={platform === code} onClick={() => setPlatform(code)}>
                      {tl(`platform.${code}`)}
                    </button>
                  ))}
                </div>
              </fieldset>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-admin-ink">{t("coursePrice")}</span>
                  <input inputMode="numeric" value={coursePrice} onChange={(event) => setCoursePrice(event.target.value)} placeholder="8000" className={inputClass} />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-admin-ink">{t("accessoryAmount")}</span>
                  <input inputMode="numeric" value={accessoryAmount} onChange={(event) => setAccessoryAmount(event.target.value)} placeholder="0" className={inputClass} />
                </label>
              </div>
              <fieldset className="flex flex-col gap-2">
                <legend className="text-xs font-semibold text-admin-ink">{t("paymentMethod")}</legend>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {SALES_PAYMENT_METHODS.map((code) => (
                    <button key={code} type="button" className={choice(paymentMethod === code)} aria-pressed={paymentMethod === code} onClick={() => setPaymentMethod(code)}>
                      {tl(`paymentMethod.${code}`)}
                    </button>
                  ))}
                </div>
              </fieldset>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-admin-ink">{t("note")}</span>
                <input value={note} maxLength={500} onChange={(event) => setNote(event.target.value)} className={inputClass} />
              </label>

              <section className="rounded-xl border border-admin-border bg-admin-soft p-3">
                <p className="text-xs font-semibold text-admin-ink">{t("preview.heading")}</p>
                {!complete ? (
                  <p className="mt-1 text-xs text-admin-muted">{t("preview.incomplete")}</p>
                ) : preview.error ? (
                  <p role="alert" className="mt-1 text-xs text-admin-danger">{explain(preview.error, t("preview.failed"))}</p>
                ) : preview.data ? (
                  <dl className="mt-2 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                    <div><dt className="text-admin-muted">{t("preview.gross")}</dt><dd className="font-bold text-admin-ink">{formatMoney(preview.data.grossAmount)}</dd></div>
                    <div><dt className="text-admin-muted">{t("preview.fee")}</dt><dd className="font-bold text-admin-ink">{formatMoney(preview.data.platformFee)}</dd></div>
                    <div><dt className="text-admin-muted">{t("preview.staff", { rate: preview.data.staffRatePercent })}</dt><dd className={`font-bold ${preview.data.staffAmount < 0 ? "text-admin-danger" : "text-admin-accent"}`}>{formatMoney(preview.data.staffAmount)}</dd></div>
                    <div><dt className="text-admin-muted">{t("preview.salon")}</dt><dd className="font-bold text-admin-ink">{formatMoney(preview.data.salonAmount)}</dd></div>
                  </dl>
                ) : (
                  <p className="mt-1 text-xs text-admin-muted">{t("preview.loading")}</p>
                )}
              </section>
              {error ? <p role="alert" className="text-sm text-admin-danger">{error}</p> : null}
            </Modal.Body>
            <Modal.Footer className="flex justify-end gap-2 border-t border-admin-border px-5 py-3">
              <Button variant="ghost" className="rounded-lg" isDisabled={busy} onPress={onClose}>{t("cancel")}</Button>
              <Button variant="primary" className="rounded-lg" isDisabled={!complete || busy} onPress={() => void submit()}>
                {busy ? t("saving") : isEdit ? t("save") : t("submit")}
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}
