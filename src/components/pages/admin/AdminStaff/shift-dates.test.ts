import { describe, expect, it } from "vitest";

import { ApiClientError } from "@/service";

import {
  createShiftsInOrder,
  expandShiftDates,
  monthCells,
  monthRange,
  nextMonthRange,
  toggleWeekdayColumn,
  weekRange,
} from "./shift-dates";

// Weekdays follow Date#getUTCDay: 0 = Sunday … 6 = Saturday.
const MON_TO_SAT = [1, 2, 3, 4, 5, 6];

describe("expandShiftDates", () => {
  it("keeps only the chosen weekdays inside the range, in order", () => {
    // 2026-09-28 is a Monday, 2026-10-04 a Sunday.
    expect(expandShiftDates("2026-09-28", "2026-10-04", MON_TO_SAT)).toEqual([
      "2026-09-28",
      "2026-09-29",
      "2026-09-30",
      "2026-10-01",
      "2026-10-02",
      "2026-10-03",
    ]);
  });

  it("treats a one-day range as that day when its weekday is chosen", () => {
    expect(expandShiftDates("2026-10-04", "2026-10-04", [0])).toEqual(["2026-10-04"]);
    expect(expandShiftDates("2026-10-04", "2026-10-04", MON_TO_SAT)).toEqual([]);
  });

  it("returns nothing for a reversed range or no weekdays", () => {
    expect(expandShiftDates("2026-10-05", "2026-10-01", MON_TO_SAT)).toEqual([]);
    expect(expandShiftDates("2026-10-01", "2026-10-05", [])).toEqual([]);
  });

  it("crosses month and year ends", () => {
    expect(expandShiftDates("2026-12-30", "2027-01-02", [0, 1, 2, 3, 4, 5, 6])).toEqual([
      "2026-12-30",
      "2026-12-31",
      "2027-01-01",
      "2027-01-02",
    ]);
  });
});

describe("quick ranges", () => {
  it("this week runs from today to Sunday", () => {
    expect(weekRange("2026-09-30")).toEqual({ from: "2026-09-30", to: "2026-10-04" });
    expect(weekRange("2026-10-04")).toEqual({ from: "2026-10-04", to: "2026-10-04" });
  });

  it("this month runs from today to the month's last day", () => {
    expect(monthRange("2026-09-27")).toEqual({ from: "2026-09-27", to: "2026-09-30" });
    expect(monthRange("2026-02-10")).toEqual({ from: "2026-02-10", to: "2026-02-28" });
  });

  it("next month is the whole following month", () => {
    expect(nextMonthRange("2026-09-27")).toEqual({ from: "2026-10-01", to: "2026-10-31" });
    expect(nextMonthRange("2026-12-05")).toEqual({ from: "2027-01-01", to: "2027-01-31" });
  });
});

describe("createShiftsInOrder", () => {
  const overlap = () => new ApiClientError({ message: "Ca lam bi trung.", code: "SHIFT_OVERLAP", status: 409 });

  it("creates each date in order and skips dates that already have an overlapping shift", async () => {
    const seen: string[] = [];
    const result = await createShiftsInOrder(["2026-09-28", "2026-09-29", "2026-09-30"], async (date) => {
      seen.push(date);
      if (date === "2026-09-29") throw overlap();
    });
    expect(seen).toEqual(["2026-09-28", "2026-09-29", "2026-09-30"]);
    expect(result).toEqual({ created: ["2026-09-28", "2026-09-30"], skipped: ["2026-09-29"], error: null });
  });

  it("stops at the first other failure and keeps what was already created", async () => {
    const boom = new ApiClientError({ message: "Server down", code: "INTERNAL", status: 500 });
    const seen: string[] = [];
    const result = await createShiftsInOrder(["2026-09-28", "2026-09-29", "2026-09-30"], async (date) => {
      seen.push(date);
      if (date === "2026-09-29") throw boom;
    });
    expect(seen).toEqual(["2026-09-28", "2026-09-29"]);
    expect(result).toEqual({ created: ["2026-09-28"], skipped: [], error: boom });
  });
});

describe("monthCells", () => {
  it("pads the month so it starts on a Monday column", () => {
    // October 2026 starts on a Thursday: Mon–Wed are blank.
    const cells = monthCells(2026, 9);
    expect(cells.slice(0, 4)).toEqual([null, null, null, "2026-10-01"]);
    expect(cells.filter(Boolean)).toHaveLength(31);
    expect(cells.at(-1)).toBe("2026-10-31");
  });
});

describe("toggleWeekdayColumn", () => {
  const cells = monthCells(2026, 9);
  const open = (date: string) => date >= "2026-10-05";

  it("selects every open date of that weekday when any is missing", () => {
    const next = toggleWeekdayColumn(new Set(["2026-10-12"]), cells, 1, open);
    expect([...next].sort()).toEqual(["2026-10-05", "2026-10-12", "2026-10-19", "2026-10-26"]);
  });

  it("clears the column when all of its open dates are already selected", () => {
    const all = new Set(["2026-10-05", "2026-10-12", "2026-10-19", "2026-10-26", "2026-10-06"]);
    expect([...toggleWeekdayColumn(all, cells, 1, open)]).toEqual(["2026-10-06"]);
  });

  it("never touches dates that cannot be picked", () => {
    // 2026-10-01 is a Thursday before the open window.
    const next = toggleWeekdayColumn(new Set(), cells, 4, open);
    expect(next.has("2026-10-01")).toBe(false);
    expect(next.has("2026-10-08")).toBe(true);
  });
});
