import type { ReactElement, ReactNode } from "react";
import { beforeEach, expect, it, vi } from "vitest";
import { initialAppointments, type Appointment } from "./data";

const harness = vi.hoisted(() => ({ selected: undefined as ReadonlySet<string> | undefined, confirm: vi.fn() }));
vi.mock("react", async (load) => ({ ...await load<typeof import("react")>(), useState: (initial: () => ReadonlySet<string>) => {
  harness.selected ??= initial();
  return [harness.selected, (update: (current: ReadonlySet<string>) => ReadonlySet<string>) => { harness.selected = update(harness.selected!); }];
} }));
vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));
vi.mock("@heroui/react", () => ({ Button: "button", Modal: Object.assign("dialog", { Backdrop: "backdrop", Container: "container", Dialog: "dialog", Header: "header", Heading: "h1", Body: "main", Footer: "footer" }) }));
vi.mock("@/service", () => ({ useAdminServices: () => ({ data: { items: [
  { id: "base", name: "Base", durationMinutes: 50 },
  { id: "addon", name: "Option", durationMinutes: 20 },
] }, isLoading: false, error: null }) }));
import { ActualServicesModal } from "./ActualServicesModal";

type Element = ReactElement<{ children?: ReactNode; type?: string; checked?: boolean; onChange?: () => void; onPress?: () => void }>;
function elements(node: ReactNode): Element[] {
  if (Array.isArray(node)) return node.flatMap(elements);
  if (node && typeof node === "object" && "props" in node) {
    const element = node as Element;
    return [element, ...elements(element.props.children)];
  }
  return [];
}
const appointment: Appointment = {
  ...initialAppointments[0],
  service: { id: "base", name: "Base", durationMinutes: 50 },
  services: [{ id: "base", name: "Base", durationMinutes: 50 }, { id: "addon", name: "Option", durationMinutes: 30 }],
};
function render(value: Appointment = appointment) {
  const nodes = elements(ActualServicesModal({ appointment: value, onClose: vi.fn(), onConfirm: harness.confirm }));
  return { checkboxes: nodes.filter(node => node.props.type === "checkbox"), submit: nodes.find(node => node.props.children === "actualServices.submit")! };
}
beforeEach(() => { harness.selected = undefined; vi.clearAllMocks(); });

it("selects every booked snapshot and submits unchanged base plus required option", () => {
  const view = render();
  expect(view.checkboxes.map(node => node.props.checked)).toEqual([true, true]);
  view.submit.props.onPress!();
  expect(harness.confirm).toHaveBeenCalledWith(["base", "addon"]);
});
it("keeps the base when the operator explicitly deselects the option", () => {
  render().checkboxes[1].props.onChange!();
  const next = render();
  expect(next.checkboxes.map(node => node.props.checked)).toEqual([true, false]);
  next.submit.props.onPress!();
  expect(harness.confirm).toHaveBeenCalledWith(["base"]);
});
it.each([undefined, []])("retains legacy/local add-on IDs when snapshot list is %s", (services) => {
  render({ ...appointment, services, addonIds: ["addon", "addon"] }).submit.props.onPress!();
  expect(harness.confirm).toHaveBeenCalledWith(["base", "addon"]);
});
it("retains snapshot selections absent from the current catalog", () => {
  render({ ...appointment, services: [...appointment.services!, { id: "retired", name: "Old", durationMinutes: 10 }] }).submit.props.onPress!();
  expect(harness.confirm).toHaveBeenCalledWith(["base", "addon", "retired"]);
});
