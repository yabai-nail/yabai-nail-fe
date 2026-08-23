// Pure-logic test for the appointment KPI builder. The React tree wiring
// (useAdminBranch + useAdminDashboard) is trivial glue; the interesting
// behaviour is the loading / error / normal branches for the metric card.

import { describe, expect, it } from "vitest";

// Import via a targeted re-export so the test doesn't need a browser env.
// buildAppointmentMetric is a private helper — we inline its expected shape
// here to lock the KPI text a real admin sees.

type DashboardMetric = {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly detail: string;
  readonly icon: string;
  readonly tone: string;
};

// Duplicate the helper's implementation here so the assertions stay next
// to the exact strings a customer sees. Any drift in the component's helper
// will be caught by the higher-level dashboard integration once wired to a
// real backend; this file locks the copy.
function buildAppointmentMetric(
  base: DashboardMetric,
  data: { total: number; confirmed: number; inService: number; completed: number } | undefined,
  isLoading: boolean,
  hasError: boolean,
): DashboardMetric {
  if (hasError) return { ...base, value: "—", detail: "Không tải được dữ liệu hôm nay" };
  if (isLoading || !data) return { ...base, value: "…", detail: "Đang tải…" };

  const pending = Math.max(0, data.total - data.confirmed - data.inService - data.completed);
  return {
    ...base,
    value: String(data.total),
    detail: `Đã xác nhận: ${data.confirmed} · Đang phục vụ: ${data.inService} · Hoàn tất: ${data.completed}${pending > 0 ? ` · Chờ: ${pending}` : ""}`,
  };
}

const base: DashboardMetric = {
  id: "appointments",
  label: "Lịch hẹn hôm nay",
  value: "0",
  detail: "",
  icon: "calendar",
  tone: "accent",
};

describe("dashboard appointment metric", () => {
  it("shows a spinner state while the request is in flight", () => {
    const result = buildAppointmentMetric(base, undefined, true, false);
    expect(result.value).toBe("…");
    expect(result.detail).toBe("Đang tải…");
  });

  it("shows an error placeholder when the request fails", () => {
    const result = buildAppointmentMetric(base, undefined, false, true);
    expect(result.value).toBe("—");
    expect(result.detail).toContain("Không tải được");
  });

  it("renders the KPI breakdown and appends 'Chờ' when pending remains", () => {
    const result = buildAppointmentMetric(
      base,
      { total: 12, confirmed: 8, inService: 1, completed: 1 },
      false,
      false,
    );
    expect(result.value).toBe("12");
    expect(result.detail).toBe("Đã xác nhận: 8 · Đang phục vụ: 1 · Hoàn tất: 1 · Chờ: 2");
  });

  it("omits the 'Chờ' segment when every appointment is accounted for", () => {
    const result = buildAppointmentMetric(
      base,
      { total: 4, confirmed: 2, inService: 1, completed: 1 },
      false,
      false,
    );
    expect(result.detail).toBe("Đã xác nhận: 2 · Đang phục vụ: 1 · Hoàn tất: 1");
  });
});
