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
  AppointmentStatus,
} from "./data";

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

function initialDraft(
  appointment: Appointment | null,
  defaultDate: string,
  options: AppointmentFormOptions,
): AppointmentDraft {
  return appointment ?? {
    date: defaultDate,
    startTime: "09:00",
    endTime: "10:30",
    customer: options.customers[0],
    service: options.services[0],
    staff: options.staff[0],
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
  onSubmit: (draft: AppointmentDraft) => void;
}>) {
  // A branch with no customers, services or staff yet cannot produce a valid
  // appointment. Say so plainly instead of rendering a form whose submit can
  // only fail.
  const missing = [
    options.customers.length === 0 ? "khách hàng" : null,
    options.services.length === 0 ? "dịch vụ" : null,
    options.staff.length === 0 ? "nhân viên" : null,
  ].filter((label): label is string => label !== null);

  const [draft, setDraft] = useState(() =>
    initialDraft(appointment, defaultDate, options),
  );
  const [errors, setErrors] = useState<AppointmentDraftErrors>({});
  const [formMessage, setFormMessage] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validateAppointmentDraft(draft);
    setErrors(nextErrors);
    setFormMessage("");

    if (Object.keys(nextErrors).length) return;
    if (hasAppointmentConflict(appointments, draft, appointment?.id)) {
      setFormMessage("Nhân viên đã có lịch trùng khung giờ này. Vui lòng chọn thời gian hoặc nhân viên khác.");
      return;
    }

    onSubmit(draft);
  }

  return (
    <Modal isOpen onOpenChange={(open) => { if (!open) onClose(); }}>
      <Modal.Backdrop>
        <Modal.Container size="lg" placement="center" scroll="inside">
          <Modal.Dialog className="overflow-hidden rounded-xl border border-admin-border bg-admin-surface">
            <Modal.CloseTrigger className="rounded-lg" />
            <Modal.Header className="flex items-center gap-3 border-b border-admin-border px-5 py-4 pr-14">
              <span className="grid size-10 place-items-center rounded-lg bg-admin-soft text-admin-accent"><CalendarDaysIcon className="size-5" /></span>
              <div>
                <Modal.Heading className="text-lg font-bold text-admin-ink">{appointment ? "Chỉnh sửa lịch hẹn" : "Thêm lịch hẹn"}</Modal.Heading>
                <p className="mt-0.5 text-xs text-admin-muted">Kiểm tra nhân viên và thời gian trước khi lưu.</p>
              </div>
            </Modal.Header>
            {missing.length > 0 ? (
              <>
                <Modal.Body className="px-5 py-6">
                  <p role="alert" className="rounded-lg bg-admin-soft px-3 py-2 text-sm text-admin-ink">
                    Chi nhánh này chưa có {missing.join(", ")}. Hãy thêm trước khi tạo lịch hẹn.
                  </p>
                </Modal.Body>
                <Modal.Footer className="border-t border-admin-border px-5 py-4">
                  <Button type="button" variant="outline" className="rounded-lg border-admin-border" onPress={onClose}>Đóng</Button>
                </Modal.Footer>
              </>
            ) : (
            <form onSubmit={submit}>
              <Modal.Body className="grid gap-4 px-5 py-5 sm:grid-cols-2">
                <Field id="appointment-date" label="Ngày" error={errors.date}><input id="appointment-date" aria-invalid={Boolean(errors.date)} aria-describedby={errors.date ? "appointment-date-error" : undefined} className={fieldClassName} type="date" value={draft.date} onChange={(event) => setDraft({ ...draft, date: event.target.value })} /></Field>
                <Field id="appointment-status" label="Trạng thái"><select id="appointment-status" className={fieldClassName} value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as AppointmentStatus })}><option value="confirmed">Đã xác nhận</option><option value="pending">Chờ xác nhận</option><option value="cancelled">Đã hủy</option></select></Field>
                <Field id="appointment-start" label="Giờ bắt đầu" error={errors.startTime}><input id="appointment-start" aria-invalid={Boolean(errors.startTime)} aria-describedby={errors.startTime ? "appointment-start-error" : undefined} className={fieldClassName} type="time" value={draft.startTime} onChange={(event) => setDraft({ ...draft, startTime: event.target.value })} /></Field>
                <Field id="appointment-end" label="Giờ kết thúc" error={errors.endTime}><input id="appointment-end" aria-invalid={Boolean(errors.endTime)} aria-describedby={errors.endTime ? "appointment-end-error" : undefined} className={fieldClassName} type="time" value={draft.endTime} onChange={(event) => setDraft({ ...draft, endTime: event.target.value })} /></Field>
                <Field id="appointment-customer" label="Khách hàng" error={errors.customer}><select id="appointment-customer" aria-invalid={Boolean(errors.customer)} aria-describedby={errors.customer ? "appointment-customer-error" : undefined} className={fieldClassName} value={draft.customer.id} onChange={(event) => setDraft({ ...draft, customer: options.customers.find((item) => item.id === event.target.value) ?? options.customers[0] })}>{options.customers.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field>
                <Field id="appointment-service" label="Dịch vụ" error={errors.service}><select id="appointment-service" aria-invalid={Boolean(errors.service)} aria-describedby={errors.service ? "appointment-service-error" : undefined} className={fieldClassName} value={draft.service.id} onChange={(event) => setDraft({ ...draft, service: options.services.find((item) => item.id === event.target.value) ?? options.services[0] })}>{options.services.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field>
                <Field id="appointment-staff" label="Nhân viên" error={errors.staff}><select id="appointment-staff" aria-invalid={Boolean(errors.staff)} aria-describedby={errors.staff ? "appointment-staff-error" : undefined} className={fieldClassName} value={draft.staff.id} onChange={(event) => setDraft({ ...draft, staff: options.staff.find((item) => item.id === event.target.value) ?? options.staff[0] })}>{options.staff.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field>
                <div className="sm:col-span-2"><Field id="appointment-note" label="Ghi chú"><textarea id="appointment-note" className={`${fieldClassName} min-h-24 py-2`} value={draft.note} onChange={(event) => setDraft({ ...draft, note: event.target.value })} placeholder="Yêu cầu hoặc lưu ý của khách..." /></Field></div>
                {formMessage ? <p role="alert" className="rounded-lg bg-admin-soft px-3 py-2 text-sm text-admin-accent sm:col-span-2">{formMessage}</p> : null}
              </Modal.Body>
              <Modal.Footer className="border-t border-admin-border px-5 py-4">
                <Button type="button" variant="outline" className="rounded-lg border-admin-border" onPress={onClose}>Đóng</Button>
                <Button type="submit" variant="primary" className="rounded-lg">{appointment ? "Lưu thay đổi" : "Tạo lịch hẹn"}</Button>
              </Modal.Footer>
            </form>
            )}
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

function Field({ id, label, error, children }: Readonly<{ id: string; label: string; error?: string; children: React.ReactNode }>) {
  return <label htmlFor={id} className="block text-sm font-semibold text-admin-ink"><span className="mb-2 block">{label}</span>{children}{error ? <span id={`${id}-error`} className="mt-1 block text-xs font-normal text-danger">{error}</span> : null}</label>;
}
