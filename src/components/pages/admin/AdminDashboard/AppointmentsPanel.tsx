"use client";

import { PlusIcon } from "@heroicons/react/24/outline";
import { Button, Card, Chip } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useMemo } from "react";

import { useAdminBranch, useAdminDashboard, type AdminAppointment } from "@/service";
import { appointments as fixtureAppointments, type Appointment as FixtureAppointment } from "./data";

// Server appointments do not carry rendered names — the admin dashboard
// payload gives ids + timestamps. The panel fills the gaps as best it can
// so a live list still reads, and callers who want richer information can
// click through to the appointments page (which will resolve customers /
// services separately).
function toFixtureAppointment(server: AdminAppointment): FixtureAppointment {
  const time = new Date(server.startsAt).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const isConfirmed =
    server.status === "CONFIRMED" || server.status.toLowerCase().includes("confirm");
  return {
    id: server.id,
    time,
    customer: `Khách #${server.customerId.slice(0, 6)}`,
    service:
      server.serviceIds.length === 0
        ? "Chưa chọn dịch vụ"
        : server.serviceIds.length === 1
          ? `Dịch vụ #${server.serviceIds[0].slice(0, 6)}`
          : `${server.serviceIds.length} dịch vụ`,
    status: isConfirmed ? "Đã xác nhận" : "Chờ xác nhận",
  };
}

export function AppointmentsPanel() {
  const router = useRouter();
  const { branchId } = useAdminBranch();
  const { data, error } = useAdminDashboard(branchId);

  const rows = useMemo(() => {
    if (!data?.upcoming) return fixtureAppointments;
    if (data.upcoming.length === 0) return [];
    return data.upcoming.map(toFixtureAppointment);
  }, [data]);

  return (
    <Card className="gap-0 rounded-xl border-admin-border bg-admin-surface p-0 shadow-none xl:col-span-5">
      <Card.Header className="flex w-full flex-row items-center justify-between gap-3 px-4 pt-4 sm:px-5 sm:pt-5">
        <h2 className="text-sm font-bold text-admin-ink">Lịch hẹn hôm nay</h2>
        <Button size="sm" variant="outline" className="rounded-lg border-admin-border" onPress={() => router.push("/admin/appointments")}>
          Xem lịch
        </Button>
      </Card.Header>
      <Card.Content className="px-4 pb-4 pt-2 sm:px-5 sm:pb-5">
        {error ? (
          <p className="py-3 text-center text-xs text-admin-muted">Không tải được lịch hẹn hôm nay.</p>
        ) : rows.length === 0 ? (
          <p className="py-3 text-center text-xs text-admin-muted">Hôm nay chưa có lịch hẹn nào.</p>
        ) : (
          <ol aria-label="Danh sách lịch hẹn hôm nay" className="divide-y divide-admin-border">
            {rows.map((appointment) => {
              const isConfirmed = appointment.status === "Đã xác nhận";
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
                      <Chip.Label>{appointment.status}</Chip.Label>
                    </Chip>
                  </button>
                </li>
              );
            })}
          </ol>
        )}

        <Button fullWidth variant="primary" className="mt-3 rounded-lg" onPress={() => router.push("/admin/appointments?create=1")}>
          <PlusIcon aria-hidden="true" className="size-5" />
          Thêm lịch hẹn
        </Button>
      </Card.Content>
    </Card>
  );
}
