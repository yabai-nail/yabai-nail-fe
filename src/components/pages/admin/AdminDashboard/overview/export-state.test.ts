import { describe, expect, it } from "vitest";

import { exportFailureKey, formatElapsed, isExportSlow } from "./export-state";

describe("formatElapsed", () => {
  it("shows minutes and zero-padded seconds", () => {
    expect(formatElapsed(0)).toBe("0:00");
    expect(formatElapsed(9)).toBe("0:09");
    expect(formatElapsed(75)).toBe("1:15");
  });
});

describe("isExportSlow", () => {
  it("flags a wait well past the worker's 15-second pickup", () => {
    expect(isExportSlow(45)).toBe(false);
    expect(isExportSlow(60)).toBe(true);
  });
});

describe("exportFailureKey", () => {
  it("maps the worker's error codes to a reason the admin can act on", () => {
    expect(exportFailureKey("REPORT_SCOPE_FORBIDDEN")).toBe("failedScope");
    expect(exportFailureKey("REPORT_FILTER_INVALID")).toBe("failedFilter");
    expect(exportFailureKey("DEPENDENCY_NOT_CONFIGURED")).toBe("failedStorage");
    expect(exportFailureKey("DEPENDENCY_UNAVAILABLE")).toBe("failedStorage");
  });

  it("falls back to the generic message for anything else", () => {
    expect(exportFailureKey("SOMETHING_NEW")).toBe("failed");
    expect(exportFailureKey(null)).toBe("failed");
    expect(exportFailureKey(undefined)).toBe("failed");
  });
});
