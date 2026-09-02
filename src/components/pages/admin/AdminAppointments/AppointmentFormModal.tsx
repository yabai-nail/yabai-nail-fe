import { useTranslations } from "next-intl";
import { CalendarDaysIcon } from "@heroicons/react/24/outline";
import { Button, Modal } from "@heroui/react";
import { useState, type FormEvent } from "react";
import {
  hasAppointmentConflict,
  validateAppointmentDraft,
  type AppointmentDraftErrors,
} from "./appointment-state";
import type {
  Appointment,
  AppointmentCustomer,
  AppointmentDraft,
  AppointmentService,
  AppointmentStaff,
} from "./data";
import { AdminSelectField } from "@/components/blocks/admin/AdminSelectField";

/**
 * The people, services and staff this form may pick from. They come from the
 * live branch, passed down by the page — the form used to import demo fixtures
 * here, so its dropdowns offered ids like `customer-1` that exist in no
 * database and every submit was rejected by the backend.
 */
export interface AppointmentFormOptions {
  readonly customers: ReadonlyArray<AppointmentCustomer>;
  readonly services: ReadonlyArray<AppointmentService>;
  readonly staff: ReadonlyArray<AppointmentStaff>;
}

const fieldClassName = "min-h-10 w-full rounded-lg border border-admin-border bg-admin-surface px-3 text-sm text-admin-ink outline-none focus:border-admin-accent focus:ring-2 focus:ring-admin-accent/20";

function endTimeFor(startTime: string, durationMinutes: number): string {
  const [hour, minute] = startTime.split(":").map(Number);
  const total = hour * 60 + minute + durationMinutes;
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

function initialDraft(
  appointment: Appointment | null,
  defaultDate: string,
  options: AppointmentFormOptions,
): AppointmentDraft {
  const customer = options.customers[0] ?? { id: "", name: "", initials: "", phone: "", birthday: "", segment: "regular", preference: "", visits: 0, totalSpend: 0 };
  const service = options.services[0] ?? { id: "", name: "", durationMinutes: 60 };
  const staff = options.staff[0] ?? { id: "", name: "", initials: "" };
  return appointment ?? {
    date: defaultDate,
    startTime: "09:00",
    endTime: endTimeFor("09:00", service.durationMinutes),
    customer,
    service,
    staff,
    status: "confirmed",
    note: "",
  };
}

export function AppointmentFormModal({
  appointment,
  appointments,
  defaultDate,
  options,
  onClose,
  onSubmit,
}: Readonly<{
  appointment: Appointment | null;
  appointments: ReadonlyArray<Appointment>;
  defaultDate: string;
  options: AppointmentFormOptions;
  onClose: () => void;
  onSubmit: (draft: AppointmentDraft) => Promise<void>;
}>) {
  const t = useTranslations("admin.appointments");
  // A branch with no customers, services or staff yet cannot produce a valid
  // appointment. Say so plainly instead of rendering a form whose submit can
  // only fail.
  const missing = [
    options.customers.length === 0 ? t("form.missingCustomers") : null,
    options.services.length === 0 ? t("form.missingServices") : null,
    options.staff.length === 0 ? t("form.missingStaff") : null,
  ].filter((label): label is string => label !== null);

  const [draft, setDraft] = useState(() =>
    initialDraft(appointment, defaultDate, options),
  );
  const [errors, setErrors] = useState<AppointmentDraftErrors>({});
  const [formMessage, setFormMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateAppointmentDraft(draft, t);
    setErrors(nextErrors);
    setFormMessage("");

    if (Object.keys(nextErrors).length) return;
    if (hasAppointmentConflict(appointments, draft, appointment?.id)) {
      setFormMessage(t("form.conflict"));
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(draft);
    } catch (thrown) {
      setFormMessage(thrown instanceof Error ? thrown.message : t("form.saveFailed"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal isOpen onOpenChange={(open) => { if (!open) onClose(); }}>
      <Modal.Backdrop>
        <Modal.Container size="lg" placement="center" scroll="inside">
          <Modal.Dialog className="overflow-hidden rounded-xl border border-admin-border bg-admin-surface">
            <Modal.CloseTrigger className="rounded-lg" />
            <Modal.Header className="flex flex-row items-center gap-3 border-b border-admin-border px-5 py-4 pr-14">
              <span className="grid size-10 place-items-center rounded-lg bg-admin-soft text-admin-accent"><CalendarDaysIcon className="size-5" /></span>
              <div>
                <Modal.Heading className="text-lg font-bold text-admin-ink">{appointment ? t("form.editTitle") : t("form.addTitle")}</Modal.Heading>
                <p className="mt-0.5 text-xs text-admin-muted">{t("form.subtitle")}</p>
              </div>
            </Modal.Header>
            {missing.length > 0 ? (
              <>
                <Modal.Body className="px-5 py-6">
                  <p role="alert" className="rounded-lg bg-admin-soft px-3 py-2 text-sm text-admin-ink">
                    {t("form.missing", { items: missing.join(", ") })}
                  </p>
                </Modal.Body>
                <Modal.Footer className="border-t border-admin-border px-5 py-4">
                  <Button type="button" variant="outline" className="rounded-lg border-admin-border" onPress={onClose}>{t("form.close")}</Button>
                </Modal.Footer>
              </>
            ) : (
            <form onSubmit={submit} className="flex min-h-0 flex-1 flex-col">
              {/* The dialog is a flex column that clips what overflows. A plain block
                  form cannot shrink, so this form's body and footer used to be cut off
                  the bottom: the note field and both buttons were unreachable. */}
              <Modal.Body className="grid min-h-0 flex-1 gap-4 overflow-y-auto px-5 py-5 sm:grid-cols-2">
                <Field id="appointment-date" label={t("form.date")} error={errors.date}><input id="appointment-date" aria-invalid={Boolean(errors.date)} aria-describedby={errors.date ? "appointment-date-error" : undefined} className={fieldClassName} type="date" value={draft.date} onChange={(event) => setDraft({ ...draft, date: event.target.value })} /></Field>
                <Field id="appointment-start" label={t("form.startTime")} error={errors.startTime}><input id="appointment-start" aria-invalid={Boolean(errors.startTime)} aria-describedby={errors.startTime ? "appointment-start-error" : undefined} className={fieldClassName} type="time" value={draft.startTime} onChange={(event) => setDraft({ ...draft, startTime: event.target.value, endTime: endTimeFor(event.target.value, draft.service.durationMinutes) })} /></Field>
                <Field id="appointment-end" label={t("form.endTime")}><input id="appointment-end" className={`${fieldClassName} opacity-70`} type="time" value={draft.endTime} readOnly aria-readonly="true" /></Field>
                {appointment ? <Field id="appointment-customer" label={t("form.customer")}><p className={`${fieldClassName} flex items-center`}>{draft.customer.name}</p></Field> : <Field id="appointment-customer" label={t("form.customer")} error={errors.customer} isControlLabelled={false}><AdminSelectField label={t("form.customer")} fullWidth isInvalid={Boolean(errors.customer)} describedBy={errors.customer ? "appointment-customer-error" : undefined} value={draft.customer.id} onChange={(value) => setDraft({ ...draft, customer: options.customers.find((item) => item.id === value) ?? draft.customer })} options={options.customers.map((item) => ({ value: item.id, label: item.name }))} /></Field>}
                {appointment ? <Field id="appointment-service" label={t("form.service")}><p className={`${fieldClassName} flex items-center`}>{draft.service.name}</p></Field> : <Field id="appointment-service" label={t("form.service")} error={errors.service} isControlLabelled={false}><AdminSelectField label={t("form.service")} fullWidth isInvalid={Boolean(errors.service)} describedBy={errors.service ? "appointment-service-error" : undefined} value={draft.service.id} onChange={(value) => { const service = options.services.find((item) => item.id === value) ?? draft.service; setDraft({ ...draft, service, endTime: endTimeFor(draft.startTime, service.durationMinutes) }); }} options={options.services.map((item) => ({ value: item.id, label: item.name }))} /></Field>}
                <Field id="appointment-staff" label={t("form.staff")} error={errors.staff} isControlLabelled={false}><AdminSelectField label={t("form.staff")} fullWidth isInvalid={Boolean(errors.staff)} describedBy={errors.staff ? "appointment-staff-error" : undefined} value={draft.staff.id} onChange={(value) => setDraft({ ...draft, staff: options.staff.find((item) => item.id === value) ?? options.staff[0] })} options={options.staff.map((item) => ({ value: item.id, label: item.name }))} /></Field>
                {!appointment ? <div className="sm:col-span-2"><Field id="appointment-note" label={t("form.note")}><textarea id="appointment-note" className={`${fieldClassName} min-h-24 py-2`} value={draft.note} onChange={(event) => setDraft({ ...draft, note: event.target.value })} placeholder={t("form.notePlaceholder")} /></Field></div> : null}
                {formMessage ? <p role="alert" className="rounded-lg bg-admin-soft px-3 py-2 text-sm text-admin-accent sm:col-span-2">{formMessage}</p> : null}
              </Modal.Body>
              <Modal.Footer className="border-t border-admin-border px-5 py-4">
                <Button type="button" variant="outline" className="rounded-lg border-admin-border" isDisabled={submitting} onPress={onClose}>{t("form.close")}</Button>
                <Button type="submit" variant="primary" className="rounded-lg" isDisabled={submitting}>{submitting ? t("form.saving") : appointment ? t("form.save") : t("form.create")}</Button>
              </Modal.Footer>
            </form>
            )}
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

/**
 * `htmlFor` only associates with a real form control. A Select renders a button
 * trigger, so those fields opt out of the label element and name themselves
 * through the control's own aria-label instead.
 */
function Field({ id, label, error, children, isControlLabelled = true }: Readonly<{ id: string; label: string; error?: string; children: React.ReactNode; isControlLabelled?: boolean }>) {
  const body = <><span className="mb-2 block">{label}</span>{children}{error ? <span id={`${id}-error`} className="mt-1 block text-xs font-normal text-danger">{error}</span> : null}</>;
  const className = "block text-sm font-semibold text-admin-ink";
  return isControlLabelled
    ? <label htmlFor={id} className={className}>{body}</label>
    : <div className={className}>{body}</div>;
}
