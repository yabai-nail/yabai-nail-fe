"use client";

import { Card, Chip } from "@heroui/react";
import { useMemo } from "react";
import { formatVnd } from "@/lib/admin-format";
import {
  useAdminAppointments,
  useAdminCustomers,
  useAdminServices,
  type AdminAppointment,
  type AdminCustomer,
  type AdminServiceItem,
} from "@/service";

const MISSING = "—";
const RECENT_LIMIT = 5;

// The appointment list is the only read model that carries a staff member's
// finished work. It has no commission field per appointment — that number only
// exists aggregated per period on the staff-performance read model — so this
// table does not show one. The branch endpoint also still ignores its query
// filters (BE-GAP-004), so `staffId` is applied client-side over the page the
// backend returns.
type OrderRow = {
  readonly id: string;
  readonly time: string;
  readonly customer: string;
  readonly service: string;
  readonly total: number;
  readonly status: string;
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Chờ xác nhận",
  CONFIRMED: "Đã xác nhận",
  CHECKED_IN: "Đã đến",
  IN_SERVICE: "Đang làm",
  AWAITING_PAYMENT: "Chờ thanh toán",
  COMPLETED: "Hoàn tất",
  CANCELLED: "Đã huỷ",
  NO_SHOW: "Không đến",
};

function statusLabel(status: string): string {
  return STATUS_LABELS[status.toUpperCase()] ?? status;
}

function statusColor(status: string): "success" | "warning" | "default" {
  const upper = status.toUpperCase();
  if (upper === "COMPLETED") return "success";
  if (upper === "CANCELLED" || upper === "NO_SHOW") return "default";
  return "warning";
}

function formatClock(iso: string): string {
  const at = new Date(iso);
  if (Number.isNaN(at.getTime())) return MISSING;
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(at);
}

function resolveServiceLabel(
  serviceIds: ReadonlyArray<string>,
  byId: ReadonlyMap<string, AdminServiceItem>,
): string {
  if (serviceIds.length === 0) return MISSING;
  if (serviceIds.length > 1) return `${serviceIds.length} dịch vụ`;
  const service = byId.get(serviceIds[0]);
  return service?.name ?? `Dịch vụ #${serviceIds[0].slice(0, 6)}`;
}

function toOrderRow(
  appointment: AdminAppointment,
  customers: ReadonlyMap<string, AdminCustomer>,
  services: ReadonlyMap<string, AdminServiceItem>,
): OrderRow {
  const customer = customers.get(appointment.customerId);
  return {
    id: appointment.id,
    time: formatClock(appointment.startsAt),
    customer:
      customer?.displayName
      ?? customer?.name
      ?? `Khách #${appointment.customerId.slice(0, 6)}`,
    service: resolveServiceLabel(appointment.serviceIds, services),
    total: appointment.totalVnd,
    status: appointment.status,
  };
}

export function RecentOrdersTable({
  branchId,
  staffId,
  staffName,
}: Readonly<{ branchId: string; staffId: string; staffName: string }>) {
  const appointments = useAdminAppointments(branchId);
  const { data: customersData } = useAdminCustomers(branchId);
  const { data: servicesData } = useAdminServices();

  const rows = useMemo<ReadonlyArray<OrderRow>>(() => {
    const customers = new Map((customersData?.items ?? []).map((item) => [item.id, item] as const));
    const services = new Map((servicesData?.items ?? []).map((item) => [item.id, item] as const));
    return (appointments.data?.items ?? [])
      .filter((appointment) => appointment.staffId === staffId)
      .slice()
      .sort((left, right) => right.startsAt.localeCompare(left.startsAt))
      .slice(0, RECENT_LIMIT)
      .map((appointment) => toOrderRow(appointment, customers, services));
  }, [appointments.data, customersData, servicesData, staffId]);

  return (
    <Card className="mt-4 min-w-0 gap-0 overflow-hidden rounded-lg border-admin-border bg-admin-surface p-0 shadow-none">
      <Card.Header className="px-4 pt-4">
        <h2 className="font-bold">Lịch hẹn gần đây của {staffName}</h2>
      </Card.Header>
      <Card.Content className="min-w-0 overflow-x-auto p-0 pt-2">
        {appointments.isLoading ? (
          <p className="px-4 pb-4 text-xs text-admin-muted">Đang tải lịch hẹn…</p>
        ) : appointments.error ? (
          <p role="alert" className="mx-4 mb-4 rounded-lg bg-danger/10 px-3 py-2 text-xs text-danger">
            Không tải được lịch hẹn của nhân viên.
          </p>
        ) : rows.length === 0 ? (
          <p className="px-4 pb-4 text-xs text-admin-muted">Nhân viên này chưa có lịch hẹn nào.</p>
        ) : (
          <table className="w-full min-w-[560px] text-left text-sm">
            <caption className="sr-only">Lịch hẹn gần đây của {staffName}</caption>
            <thead className="border-b border-admin-border text-xs text-admin-muted">
              <tr>
                <th scope="col" className="px-4 py-3">Thời gian</th>
                <th scope="col" className="px-3 py-3">Khách hàng</th>
                <th scope="col" className="px-3 py-3">Dịch vụ</th>
                <th scope="col" className="px-3 py-3">Tổng tiền</th>
                <th scope="col" className="px-3 py-3">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-admin-border">
              {rows.map((order) => (
                <tr key={order.id}>
                  <td className="px-4 py-3">{order.time}</td>
                  <td className="px-3 py-3 font-semibold">{order.customer}</td>
                  <td className="px-3 py-3">{order.service}</td>
                  <td className="px-3 py-3">
                    {typeof order.total === "number" ? formatVnd(order.total) : MISSING}
                  </td>
                  <td className="px-3 py-3">
                    <Chip size="sm" variant="soft" color={statusColor(order.status)}>
                      <Chip.Label>{statusLabel(order.status)}</Chip.Label>
                    </Chip>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card.Content>
    </Card>
  );
}
