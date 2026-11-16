import { beforeEach, describe, expect, it, vi } from "vitest";

const harness = vi.hoisted(() => ({ states: [] as unknown[], setters: [] as ReturnType<typeof vi.fn>[], next: 0, update: vi.fn(), toast: vi.fn() }));
vi.mock("react", async (load) => ({
  ...await load<typeof import("react")>(),
  useState: (initial: unknown) => {
    const index = harness.next++;
    const setter = vi.fn();
    harness.setters[index] = setter;
    return [index in harness.states ? harness.states[index] : initial, setter];
  },
}));
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, values?: Record<string, unknown>) => (values ? `${key}:${values.name}` : key),
}));
vi.mock("@/lib/app-toast", () => ({ notifySuccess: harness.toast }));
vi.mock("@/service", async (load) => ({
  ...await load<typeof import("@/service")>(),
  adminService: { updatePriceTier: harness.update },
}));

import { ApiClientError, type AdminPriceTier } from "@/service";
import { usePriceTierPin } from "./usePriceTierPin";

const tier = (isPinned?: boolean): AdminPriceTier => ({ id: "t1", name: "Gel", amount: 8800, designCount: 2, version: 7, isPinned });
// useState order in the hook: pending, error.
const [PENDING, ERROR] = [0, 1];
function hook(pending: ReadonlySet<string> = new Set()) {
  harness.next = 0;
  harness.states = [pending];
  harness.setters = [];
  const onChanged = vi.fn();
  // React is mocked above, so the hook runs as a plain function here.
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return { ...usePriceTierPin(onChanged), onChanged };
}

beforeEach(() => { vi.clearAllMocks(); harness.update.mockResolvedValue({}); });

describe("price tier pin", () => {
  it.each([
    ["pins an unpinned tier", false, true, "pinSuccess:Gel"],
    ["pins a tier from an older API without isPinned", undefined, true, "pinSuccess:Gel"],
    ["unpins with an explicit false", true, false, "unpinSuccess:Gel"],
  ])("%s with only isPinned and the tier's version", async (_name, stored, sent, toast) => {
    const pin = hook();
    await pin.toggle(tier(stored));
    expect(harness.update).toHaveBeenCalledWith("t1", { isPinned: sent }, 7);
    expect(harness.toast).toHaveBeenCalledWith(toast);
    expect(pin.onChanged).toHaveBeenCalledTimes(1);
    expect(harness.setters[ERROR]).toHaveBeenCalledWith(null);
  });

  it("marks the tier pending while writing and clears it after", async () => {
    const pin = hook();
    await pin.toggle(tier(false));
    const [add, remove] = harness.setters[PENDING].mock.calls.map(([update]) => update as (current: ReadonlySet<string>) => ReadonlySet<string>);
    expect([...add(new Set())]).toEqual(["t1"]);
    expect([...remove(new Set(["t1", "t2"]))]).toEqual(["t2"]);
  });

  it("ignores a second press while the first is still writing", async () => {
    const pin = hook(new Set(["t1"]));
    await pin.toggle(tier(false));
    expect(harness.update).not.toHaveBeenCalled();
  });

  it("reloads on a version conflict and asks to retry", async () => {
    harness.update.mockRejectedValue(new ApiClientError({ message: "stale", status: 412, code: "VERSION_CONFLICT" }));
    const pin = hook();
    await pin.toggle(tier(false));
    expect(pin.onChanged).toHaveBeenCalledTimes(1);
    expect(harness.setters[ERROR]).toHaveBeenLastCalledWith("conflict");
    expect(harness.toast).not.toHaveBeenCalled();
  });

  it("reports any other failure for that tier without reloading", async () => {
    harness.update.mockRejectedValue(new ApiClientError({ message: "nope", status: 403, code: "FORBIDDEN" }));
    const pin = hook();
    await pin.toggle(tier(true));
    expect(pin.onChanged).not.toHaveBeenCalled();
    expect(harness.setters[ERROR]).toHaveBeenLastCalledWith("pinFailed:Gel");
  });
});
