"use client";

import type { Translator } from "@/i18n/config";
import { useTranslations } from "next-intl";
import { PlusIcon } from "@heroicons/react/24/outline";
import { Button, Card, Chip } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useMemo } from "react";

import {
  useAdminBranch,
  useAdminCustomers,
  useAdminDashboard,
  useAdminServices,
  type AdminAppointment,
} from "@/service";
// One mapping for the whole console. This panel used to keep its own two-way
// guess, so a COMPLETED appointment read "Chờ xác nhận" directly beneath the
// header counting it as finished.
import {
  APPOINTMENT_STATUS_KEY,
  normalizeAppointmentStatus,
} from "../AdminAppointments/status";
import { formatClock } from "./adapters";
import type { Appointment as AppointmentRow } from "./data";

/**
 * The dashboard payload carries ids and timestamps only, so customer and
 * service names are joined from the branch's own lists — the panel used to
 * print `Khách #596b00` beside a screen that had the real name.
 */
function toAppointmentRow(
  server: AdminAppointment,
  lookups: { customers: ReadonlyMap<string, string>; services: ReadonlyMap<string, string> },
  t: Translator,
  timeZone?: string,
): AppointmentRow {
  const serviceNames = server.serviceIds.map((id) => lookups.services.get(id)).filter(Boolean);
  return {
    id: server.id,
    time: formatClock(server.startsAt, timeZone),
    customer: lookups.customers.get(server.customerId) ?? t("appointments.unnamedCustomer"),
    service:
      server.serviceIds.length === 0
        ? t("appointments.noService")
        : server.serviceIds.length === 1
          ? serviceNames[0] ?? t("appointments.unnamedService")
          : t("appointments.serviceCount", { count: server.serviceIds.length }),
    // The code, not its label. This field was the label, and the list below compared
    // it against the Vietnamese words -- which no longer exist once the words move.
    status: normalizeAppointmentStatus(server.status),
  };
}

export function AppointmentsPanel() {
  const t = useTranslations("admin.dashboard");
  const tStatus = useTranslations("admin.appointmentStatus");
  const router = useRouter();
  const { branchId } = useAdminBranch();
  const { data, error, isLoading } = useAdminDashboard(branchId);
  const { data: customersData } = useAdminCustomers(branchId);
  const { data: servicesData } = useAdminServices();

  const lookups = useMemo(() => ({
    customers: new Map((customersData?.items ?? []).map((c) => [c.id, c.displayName ?? c.name ?? t("appointments.unnamedCustomer")] as const)),
    services: new Map((servicesData?.items ?? []).map((s) => [s.id, s.name] as const)),
  }), [customersData, servicesData, t]);

  const rows = useMemo(
    () => (data?.upcoming ?? []).map((item) => toAppointmentRow(item, lookups, t, data?.branchTimeZone)),
    [data, lookups, t],
  );

  return (
    <Card className="flex h-full flex-col gap-0 rounded-xl border-admin-border bg-admin-surface p-0 shadow-none xl:col-span-4">
      <Card.Header className="flex w-full flex-row items-center justify-between gap-3 px-4 pt-4 sm:px-5 sm:pt-5">
        <h2 className="text-sm font-bold text-admin-ink">{t("appointments.heading")}</h2>
        <Button size="sm" variant="outline" className="rounded-lg border-admin-border" onPress={() => router.push("/admin/appointments")}>
          Xem lịch
        </Button>
      </Card.Header>
      <Card.Content className="flex flex-1 flex-col px-4 pb-4 pt-3 sm:px-5 sm:pb-5">
        {error ? (
          <p role="alert" className="rounded-lg bg-danger/10 px-3 py-3 text-center text-xs text-danger">
            Không tải được lịch hẹn hôm nay.
          </p>
        ) : !branchId || isLoading ? (
          <p className="py-3 text-center text-xs text-admin-muted">{t("appointments.loading")}</p>
        ) : rows.length === 0 ? (
          <p className="py-3 text-center text-xs text-admin-muted">{t("appointments.empty")}</p>
        ) : (
          <ol aria-label={t("appointments.listLabel")} className="divide-y divide-admin-border">
            {rows.map((appointment) => {
              const isConfirmed = appointment.status === "confirmed";
              return (
                <li key={appointment.id}>
                  <button
                    type="button"
                    onClick={() =>
                      router.push(`/admin/appointments?id=${encodeURIComponent(appointment.id)}`)
                    }
                    className="grid w-full grid-cols-[3.5rem_1fr] gap-x-3 gap-y-2 py-3 text-left transition-colors hover:bg-admin-soft sm:grid-cols-[3.5rem_1fr_auto] sm:items-center"
                  >
                    <time className="text-sm font-bold text-admin-accent" dateTime={appointment.time}>
                      {appointment.time}
                    </time>
                    <div className="min-w-0 border-l border-admin-border pl-3">
                      <p className="truncate text-sm font-semibold text-admin-ink">{appointment.customer}</p>
                      <p className="mt-1 truncate text-xs text-admin-muted">{appointment.service}</p>
                    </div>
                    <Chip
                      size="sm"
                      variant="soft"
                      color={isConfirmed ? "accent" : "warning"}
                      className="col-start-2 w-fit sm:col-start-auto"
                    >
                      <Chip.Label>{tStatus(APPOINTMENT_STATUS_KEY[appointment.status])}</Chip.Label>
                    </Chip>
                  </button>
                </li>
              );
            })}
          </ol>
        )}

        {/* mt-auto pins the action to the bottom edge, so the three cards in this
            row end on one line however many appointments the day holds. */}
        <Button fullWidth variant="primary" className="mt-auto pt-3 rounded-lg" onPress={() => router.push("/admin/appointments?create=1")}>
          <PlusIcon aria-hidden="true" className="size-5" />
          Thêm lịch hẹn
        </Button>
      </Card.Content>
    </Card>
  );
}
