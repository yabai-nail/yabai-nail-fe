import type { Translator } from "@/i18n/config";
import type { AdminAppointment, AdminServiceItem } from "@/service/admin/types";
import type { AppointmentService } from "./data";

/** Existing bookings use their frozen snapshot, not today's catalog/branch overrides. */
export function bookedServices(
  appointment: Pick<AdminAppointment, "serviceIds" | "services" | "startsAt" | "endsAt">,
  catalog: ReadonlyMap<string, AdminServiceItem>,
  t: Translator,
): { service: AppointmentService; services: AppointmentService[] } {
  const services: AppointmentService[] = appointment.services?.length
    ? [...appointment.services].sort((a, b) => a.sortOrder - b.sortOrder).map((item) => ({
        id: item.serviceId, name: item.serviceName ?? item.name ?? t("fallback.service"),
        durationMinutes: item.durationMinutes, unitPrice: item.unitPrice,
      }))
    : appointment.serviceIds.map((id) => ({
        id, name: catalog.get(id)?.name ?? t("fallback.service"),
        durationMinutes: catalog.get(id)?.durationMinutes ?? 60,
        unitPrice: catalog.get(id)?.price,
      }));
  const storedMinutes = (Date.parse(appointment.endsAt) - Date.parse(appointment.startsAt)) / 60_000;
  return {
    services,
    service: {
      id: services[0]?.id ?? "unknown",
      name: services.length > 1 ? t("fallback.multiService", { count: services.length }) : services[0]?.name ?? t("fallback.service"),
      durationMinutes: Number.isFinite(storedMinutes) && storedMinutes > 0
        ? storedMinutes : services.reduce((total, item) => total + item.durationMinutes, 0),
    },
  };
}
