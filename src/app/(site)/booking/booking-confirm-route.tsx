"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

import {
  bookingService,
  useAvailability,
  useBranch,
  useBranchEligibleStaff,
  useBranchService,
} from "@/service";

import { formatMoney } from "@/lib/admin-format";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

const BookingConfirmRoute = () => {
  const params = useSearchParams();
  const branchId = params.get("branchId");
  const serviceId = params.get("serviceId");

  const { data: branch } = useBranch(branchId);
  const { data: service } = useBranchService(branchId, serviceId);
  const { data: staffList } = useBranchEligibleStaff(branchId);

  const [date, setDate] = useState<string>(() => todayIso());
  const [staffId, setStaffId] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState<null | { id: string; startsAt: string }>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const availabilityQuery = useMemo(() => {
    if (!branchId || !serviceId) return null;
    const query: Record<string, string> = { branchId, serviceIds: serviceId, date };
    if (staffId) query.staffId = staffId;
    return query;
  }, [branchId, serviceId, date, staffId]);
  const { data: availability, isLoading: loadingSlots } = useAvailability(availabilityQuery);
  const slots = availability?.slots ?? [];

  // Missing route params → send the customer back to step 1 with a note.
  if (!branchId || !serviceId) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center">
        <p className="max-w-md text-sm text-muted">
          Vui lòng chọn dịch vụ từ trang{" "}
          <Link className="font-semibold text-accent underline" href="/booking/services">
            Đặt lịch
          </Link>{" "}
          trước khi tiếp tục.
        </p>
      </main>
    );
  }

  if (confirmation) {
    const when = new Date(confirmation.startsAt).toLocaleString("vi-VN", {
      weekday: "long",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    return (
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center">
        <div className="max-w-md rounded-2xl border border-border bg-surface p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent-soft-foreground">
            Đặt lịch thành công
          </p>
          <h1 className="font-display mt-4 text-4xl italic text-foreground">Cảm ơn bạn!</h1>
          <p className="mt-4 text-sm leading-6 text-muted">
            Lịch hẹn của bạn tại {branch?.name ?? "YABAI"} đã được ghi nhận. Chúng tôi sẽ liên hệ
            xác nhận trước giờ hẹn.
          </p>
          <p className="mt-6 text-sm font-semibold text-foreground">{when}</p>
          <p className="mt-1 text-xs text-muted">Mã lịch hẹn: {confirmation.id}</p>
          <Link
            href="/"
            className="mt-6 inline-flex items-center justify-center rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:border-accent"
          >
            Về trang chủ
          </Link>
        </div>
      </main>
    );
  }

  const canSubmit =
    Boolean(selectedSlot) &&
    name.trim().length >= 2 &&
    phone.trim().length >= 8 &&
    !submitting;

  const submit = async () => {
    if (!canSubmit || !selectedSlot) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const appointment = await bookingService.createAppointment({
        branchId,
        serviceIds: [serviceId],
        staffId: staffId ?? null,
        startsAt: selectedSlot,
        note: note.trim() || undefined,
        customer: {
          displayName: name.trim(),
          phone: phone.trim(),
        },
      });
      setConfirmation({ id: appointment.id, startsAt: appointment.startsAt });
    } catch (error) {
      setSubmitError(
        error instanceof Error && error.message
          ? error.message
          : "Không thể tạo lịch hẹn. Vui lòng thử lại.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex flex-1 flex-col px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-4xl">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent-soft-foreground">
          YABAI Booking · Bước 2
        </p>
        <h1 className="font-display mt-3 text-4xl italic leading-tight tracking-tight text-foreground sm:text-5xl">
          Chọn kỹ thuật viên và thời gian
        </h1>

        {/* Chosen service */}
        <section aria-label="Dịch vụ đã chọn" className="mt-8 rounded-2xl border border-border bg-surface p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">
            {branch?.name ?? "Chi nhánh"}
          </p>
          <div className="mt-2 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">
              {service?.name ?? "Dịch vụ"}
            </h2>
            {service ? (
              <div className="text-right">
                <p className="text-sm font-semibold text-accent">{formatMoney(service.price)}</p>
                <p className="text-xs text-muted">{service.durationMinutes} phút</p>
              </div>
            ) : null}
          </div>
        </section>

        {/* Staff picker */}
        <section aria-label="Kỹ thuật viên" className="mt-6">
          <h2 className="text-sm font-semibold text-foreground">Kỹ thuật viên</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setStaffId(null)}
              className={`rounded-full border px-4 py-2 text-sm transition ${
                staffId === null
                  ? "border-accent bg-accent text-accent-foreground"
                  : "border-border text-foreground hover:border-accent"
              }`}
            >
              Bất kỳ ai rảnh
            </button>
            {(staffList?.items ?? []).map((staff) => (
              <button
                type="button"
                key={staff.id}
                onClick={() => setStaffId(staff.id)}
                className={`rounded-full border px-4 py-2 text-sm transition ${
                  staffId === staff.id
                    ? "border-accent bg-accent text-accent-foreground"
                    : "border-border text-foreground hover:border-accent"
                }`}
              >
                {staff.displayName}
              </button>
            ))}
          </div>
        </section>

        {/* Date + slots */}
        <section aria-label="Thời gian" className="mt-6">
          <h2 className="text-sm font-semibold text-foreground">Chọn ngày và giờ</h2>
          <input
            type="date"
            value={date}
            min={todayIso()}
            onChange={(event) => {
              setDate(event.target.value);
              setSelectedSlot(null);
            }}
            className="mt-3 rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground"
          />
          <div className="mt-4">
            {loadingSlots ? (
              <p className="text-sm text-muted">Đang tải khung giờ…</p>
            ) : slots.length === 0 ? (
              <p className="text-sm text-muted">Không có khung giờ khả dụng cho ngày này.</p>
            ) : (
              <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
                {slots.map((slot) => {
                  const label = new Date(slot.startsAt).toLocaleTimeString("en-GB", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                  });
                  const disabled = slot.status !== "AVAILABLE";
                  const selected = selectedSlot === slot.startsAt;
                  return (
                    <li key={slot.startsAt}>
                      <button
                        type="button"
                        disabled={disabled}
                        onClick={() => setSelectedSlot(slot.startsAt)}
                        className={`w-full rounded-lg border px-3 py-2 text-sm transition ${
                          selected
                            ? "border-accent bg-accent text-accent-foreground"
                            : disabled
                              ? "cursor-not-allowed border-border text-muted opacity-50"
                              : "border-border text-foreground hover:border-accent"
                        }`}
                      >
                        {label}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>

        {/* Contact + confirm */}
        <section aria-label="Thông tin liên hệ" className="mt-8 rounded-2xl border border-border bg-surface p-6">
          <h2 className="text-sm font-semibold text-foreground">Thông tin của bạn</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-foreground">Tên</span>
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Nguyễn Thu Hương"
                className="rounded-lg border border-border bg-surface px-3 py-2 text-foreground"
              />
            </label>
            <label className="flex flex-col gap-2 text-sm">
              <span className="font-medium text-foreground">Số điện thoại</span>
              <input
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="0901234567"
                className="rounded-lg border border-border bg-surface px-3 py-2 text-foreground"
              />
            </label>
          </div>
          <label className="mt-4 flex flex-col gap-2 text-sm">
            <span className="font-medium text-foreground">Ghi chú (tùy chọn)</span>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={2}
              placeholder="Ví dụ: dị ứng sản phẩm nào đó, thời gian mong muốn khác…"
              className="rounded-lg border border-border bg-surface px-3 py-2 text-foreground"
            />
          </label>

          {submitError ? (
            <p className="mt-4 text-sm text-danger" role="alert">{submitError}</p>
          ) : null}

          <button
            type="button"
            disabled={!canSubmit}
            onClick={submit}
            className={`mt-6 inline-flex w-full items-center justify-center rounded-full px-4 py-3 text-sm font-semibold transition ${
              canSubmit
                ? "bg-accent text-accent-foreground hover:opacity-90"
                : "cursor-not-allowed bg-border text-muted"
            }`}
          >
            {submitting ? "Đang gửi…" : "Xác nhận đặt lịch"}
          </button>
        </section>
      </div>
    </main>
  );
};

export default BookingConfirmRoute;
