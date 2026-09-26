import { expect, it, vi } from "vitest";

vi.mock("@/components/pages/admin/AdminAppointments", () => ({ AdminAppointments: () => null }));
import AdminAppointmentsPage from "./page";

it("forwards the explicit conversation customer without changing branch context", async () => {
  const page = await AdminAppointmentsPage({ searchParams: Promise.resolve({ create: "1", customerId: "message-customer" }) });
  expect(page.props).toEqual({ initialCreate: true, initialSelectedId: undefined, initialCustomerId: "message-customer" });
  const next = await AdminAppointmentsPage({ searchParams: Promise.resolve({ create: "1", customerId: "another-customer" }) });
  expect(next.key).not.toBe(page.key);
});

it("retains ordinary create and appointment detail links", async () => {
  const create = await AdminAppointmentsPage({ searchParams: Promise.resolve({ create: "1" }) });
  expect(create.props.initialCustomerId).toBeUndefined();
  const detail = await AdminAppointmentsPage({ searchParams: Promise.resolve({ id: "appointment-id" }) });
  expect(detail.props.initialCreate).toBe(false);
  expect(detail.props.initialSelectedId).toBe("appointment-id");
});
