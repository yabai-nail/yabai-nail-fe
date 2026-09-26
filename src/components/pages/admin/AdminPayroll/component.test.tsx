import type { ReactElement, ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const harness = vi.hoisted(() => ({
  branchId: "hiro",
  states: [] as unknown[],
  nextState: 0,
  writes: [] as Array<{ slot: number; value: unknown }>,
  cleanups: [] as Array<() => void>,
  create: vi.fn(),
  download: vi.fn(),
  notify: vi.fn(),
}));

vi.mock("react", async (load) => ({
  ...await load<typeof import("react")>(),
  useState: (initial: unknown) => {
    const slot = harness.nextState++;
    const value = slot in harness.states ? harness.states[slot] : typeof initial === "function" ? initial() : initial;
    return [value, (next: unknown) => harness.writes.push({ slot, value: next })];
  },
  useRef: (value: unknown) => ({ current: value }),
  useEffect: (effect: () => (() => void)) => { harness.cleanups.push(effect()); },
}));
vi.mock("next-intl", () => ({ useTranslations: () => Object.assign((key: string) => key, { has: () => true }) }));
vi.mock("@heroui/react", () => ({
  Button: "button",
  Card: Object.assign("card", { Header: "header", Content: "section" }),
  Modal: "dialog",
}));
vi.mock("@/components/blocks/admin/AdminPageLayout", () => ({ AdminPageLayout: "main" }));
vi.mock("@/components/blocks/admin/MonthPicker", () => ({ MonthPicker: "month-picker" }));
vi.mock("@/lib/app-toast", () => ({ notifySuccess: harness.notify }));
vi.mock("@/service", () => ({
  adminService: { createReportExport: harness.create, reportExportDownloadUrl: harness.download },
  useAdminBranch: () => ({ branchId: harness.branchId }),
  useAdminPermission: () => true,
  useAdminPayroll: () => ({ data: { rows: [] } }),
  useAdminReportExport: () => ({ data: { status: "READY" }, mutate: vi.fn() }),
}));

import { AdminPayrollComponent } from "./component";

type Element = ReactElement<{ children?: ReactNode; onPress?: () => void }>;

function action(node: ReactNode, label: string): (() => void) | undefined {
  if (Array.isArray(node)) {
    for (const child of node) { const found = action(child, label); if (found) return found; }
  } else if (node && typeof node === "object" && "props" in node) {
    const element = node as Element;
    const children = element.props.children;
    if ((children === label || Array.isArray(children) && children.includes(label)) && element.props.onPress) return element.props.onPress;
    return action(children, label);
  }
}

function boundary(period = "2026-09") {
  harness.nextState = 0;
  harness.states = [period];
  return AdminPayrollComponent();
}

function sheet(withExport = false): ReactNode {
  const parent = boundary();
  harness.nextState = 0;
  harness.states = [null, null, null, withExport ? { exportId: "september-file", status: "READY" } : null, null];
  return (parent.type as (props: typeof parent.props) => ReactNode)(parent.props);
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: Error) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

beforeEach(() => {
  harness.branchId = "hiro";
  harness.states = [];
  harness.nextState = 0;
  harness.writes = [];
  harness.cleanups = [];
  vi.clearAllMocks();
});

describe("payroll export branch/month lifetime", () => {
  it("keeps month selection outside the keyed sheet and changes identity for either filter", () => {
    const september = boundary();
    expect(september.props.period).toBe("2026-09");
    expect(boundary("2026-08").key).not.toBe(september.key);
    harness.branchId = "tokyo";
    expect(boundary().key).not.toBe(september.key);
    expect(boundary().props.period).toBe("2026-09");
  });

  it.each(["resolve", "reject"] as const)("ignores a queued export that %ss after the old sheet unmounts", async (outcome) => {
    const pending = deferred<{ exportId: string; status: string }>();
    harness.create.mockReturnValue(pending.promise);
    action(sheet(), "exportSheet")!();
    expect(harness.create).toHaveBeenCalledWith({ reportType: "PAYROLL_MONTHLY", format: "XLSX", filters: { branchId: "hiro", period: "2026-09" } });
    const writesBefore = harness.writes.length;
    harness.cleanups.forEach((cleanup) => cleanup());
    if (outcome === "resolve") pending.resolve({ exportId: "late-september", status: "QUEUED" });
    else pending.reject(new Error("old month failed"));
    await pending.promise.catch(() => undefined);
    expect(harness.writes).toHaveLength(writesBefore);
    expect(harness.notify).not.toHaveBeenCalled();
  });

  it("ignores a late download URL after changing month or branch", async () => {
    const pending = deferred<{ signedUrl: string }>();
    harness.download.mockReturnValue(pending.promise);
    action(sheet(true), "getLink")!();
    expect(harness.download).toHaveBeenCalledWith("september-file");
    const writesBefore = harness.writes.length;
    harness.cleanups.forEach((cleanup) => cleanup());
    pending.resolve({ signedUrl: "https://example.test/old-september.xlsx" });
    await pending.promise;
    expect(harness.writes).toHaveLength(writesBefore);
  });

  it("retains a successful export for the still-active sheet", async () => {
    const info = { exportId: "current-september", status: "QUEUED" };
    harness.create.mockResolvedValue(info);
    action(sheet(), "exportSheet")!();
    await Promise.resolve();
    expect(harness.writes).toContainEqual({ slot: 3, value: info });
    expect(harness.notify).toHaveBeenCalledWith("exportQueued");
  });
});
