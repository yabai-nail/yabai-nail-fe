import type { FormEvent, ReactElement, ReactNode } from "react";
import { expect, it, vi } from "vitest";
import type { Translator } from "@/i18n/config";
import type { Appointment } from "./data";
import { bookedServices } from "./booked-services";

vi.mock("react", async (load) => ({ ...await load<typeof import("react")>(),
  useState: (value: unknown) => [typeof value === "function" ? value() : value, vi.fn()],
  useCallback: (callback: unknown) => callback,
}));
vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));
vi.mock("@heroui/react", () => ({ Button: "button", Modal: Object.assign("dialog", { Backdrop: "backdrop", Container: "container", Dialog: "dialog", CloseTrigger: "button", Header: "header", Heading: "h1", Body: "main", Footer: "footer" }) }));
vi.mock("./AppointmentAddonPicker", () => ({ AppointmentAddonPicker: () => null }));
vi.mock("./AppointmentCustomerPicker", () => ({ AppointmentCustomerPicker: () => null }));
import { AppointmentFormModal } from "./AppointmentFormModal";

type Element = ReactElement<{ children?: ReactNode; onSubmit?: (event: FormEvent<HTMLFormElement>) => Promise<void> }>;
function find(node: ReactNode, predicate: (node: Element) => boolean): Element | undefined {
  if (Array.isArray(node)) return node.map((child) => find(child, predicate)).find(Boolean);
  if (node && typeof node === "object" && "props" in node) {
    const element = node as Element;
    return predicate(element) ? element : find(element.props.children, predicate);
  }
}
it("opens and submits an existing 80-minute booking without shrinking its end to base-only 50 minutes", async () => {
  const mapped = bookedServices({ serviceIds: ["base", "addon"], startsAt: "2026-09-27T00:00:00Z", endsAt: "2026-09-27T01:20:00Z", services: [
    { serviceId: "base", serviceName: "Base", durationMinutes: 50, unitPrice: 5500, sortOrder: 0 },
    { serviceId: "addon", serviceName: "Addon", durationMinutes: 30, unitPrice: 700, sortOrder: 1 },
  ] }, new Map(), ((key: string) => key) as Translator);
  const appointment: Appointment = { id: "booking", date: "2026-09-27", startTime: "09:00", endTime: "10:20", ...mapped,
    customer: { id: "customer", name: "Customer", initials: "C", phone: "", birthday: "", segment: "regular", preference: "", visits: 0, totalSpend: 0 },
    staff: { id: "staff", name: "Staff", initials: "S", serviceIds: ["base"] }, status: "confirmed", note: "",
  };
  const onSubmit = vi.fn();
  const tree = AppointmentFormModal({ appointment, appointments: [appointment], defaultDate: appointment.date, branchId: "branch", options: { customers: [], services: [], staff: [appointment.staff] }, onClose: vi.fn(), onSubmit });
  expect(find(tree, (node) => node.props.children === "10:20")).toBeDefined();
  expect(find(tree, (node) => node.props.children === "09:50")).toBeUndefined();
  await find(tree, (node) => Boolean(node.props.onSubmit))!.props.onSubmit!({ preventDefault: vi.fn() } as unknown as FormEvent<HTMLFormElement>);
  expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ endTime: "10:20", service: expect.objectContaining({ durationMinutes: 80 }) }));
});
