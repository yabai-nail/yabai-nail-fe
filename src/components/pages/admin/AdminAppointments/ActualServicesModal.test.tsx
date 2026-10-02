import { createElement, type ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { BranchServiceAddonGroup } from "@/service";
import { initialAppointments, type Appointment } from "./data";

const hooks = vi.hoisted(() => ({ services: vi.fn(), addons: vi.fn() }));
vi.mock("next-intl", () => ({ useTranslations: () => (key: string) => key }));
vi.mock("@heroicons/react/24/outline", () => ({ WrenchScrewdriverIcon: () => null }));
vi.mock("@heroui/react", () => {
  const part = (tag: string) => function MockPart({ children, ...props }: Record<string, unknown> & { children?: ReactNode }) { return createElement(tag, props, children); };
  const Modal = Object.assign(part("dialog"), { Backdrop: part("div"), Container: part("div"), Dialog: part("div"), Header: part("header"), Heading: part("h1"), Body: part("main"), Footer: part("footer") });
  return { Button: ({ children, isDisabled, onPress }: { children?: ReactNode; isDisabled?: boolean; onPress?: () => void }) => createElement("button", { disabled: isDisabled, onClick: onPress }, children), Modal };
});
vi.mock("@/service", async (load) => ({
  ...await load<typeof import("@/service")>(),
  useBranchServices: hooks.services,
  useBranchServiceAddons: hooks.addons,
}));
import { ActualServicesModal, actualServiceIds, toggleActualAddon, validActualAddons } from "./ActualServicesModal";

const option = (id: string, extra = {}) => ({ id, serviceId: id, code: id, name: id, price: 100, durationMinutes: 5, available: true, ...extra });
const group = (extra = {}) => ({
  code: "FINISH",
  selectionMode: "SINGLE",
  required: true,
  minSelections: 1,
  maxSelections: 1,
  options: [option("old"), option("new"), option("disabled", { available: false })],
  ...extra,
}) satisfies BranchServiceAddonGroup;

const appointment: Appointment = {
  ...initialAppointments[0],
  service: { id: "base", name: "Base", durationMinutes: 50 },
  services: [{ id: "base", name: "Base", durationMinutes: 50 }, { id: "old", name: "Old", durationMinutes: 5 }],
};

beforeEach(() => {
  hooks.services.mockReset().mockReturnValue({ data: { items: [{ id: "base", branchId: "branch-a", name: "Base", price: 1_000, durationMinutes: 50, active: true }] }, isLoading: false, error: null });
  hooks.addons.mockReset().mockReturnValue({ data: { serviceId: "base", groups: [group()] }, isLoading: false, error: null });
});

it("loads the branch catalogue and add-ons for the selected base service", () => {
  const html = renderToStaticMarkup(createElement(ActualServicesModal, { branchId: "branch-a", appointment, onClose: vi.fn(), onConfirm: vi.fn() }));
  expect(hooks.services).toHaveBeenCalledWith("branch-a");
  expect(hooks.addons).toHaveBeenCalledWith("branch-a", "base");
  expect(html).toContain("Base");
  expect(html).toContain("disabled");
  expect(html).toContain("disabled=\"\"");
});

describe("actual service selection", () => {
  it("replaces a SINGLE choice and ignores unavailable add-ons", () => {
    const selected = toggleActualAddon(group(), "new", new Set(["old", "other"]));
    expect([...selected]).toEqual(["other", "new"]);
    expect([...toggleActualAddon(group(), "disabled", selected)]).toEqual(["other", "new"]);
  });

  it("enforces MULTIPLE maximum and makes an explicit no-selection option exclusive", () => {
    const multiple = group({ selectionMode: "MULTIPLE", required: false, minSelections: 0, maxSelections: 2, options: [option("a"), option("b"), option("c"), option("none", { representsNoSelection: true })] });
    expect([...toggleActualAddon(multiple, "c", new Set(["a", "b"]))]).toEqual(["a", "b"]);
    expect([...toggleActualAddon(multiple, "none", new Set(["a"]))]).toEqual(["none"]);
    expect([...toggleActualAddon(multiple, "a", new Set(["none"]))]).toEqual(["a"]);
  });

  it("validates required groups and submits only available compatible IDs", () => {
    expect(validActualAddons([group()], new Set())).toBe(false);
    expect(validActualAddons([group()], new Set(["old"]))).toBe(true);
    expect(actualServiceIds("base", [group()], new Set(["old", "disabled", "retired"]))).toEqual(["base", "old"]);
  });
});
