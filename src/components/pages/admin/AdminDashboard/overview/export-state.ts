/**
 * The export API only reports QUEUED → READY / FAILED, never a percentage, so the wait is shown
 * as honest elapsed time plus a note once it runs long, and a failure names its cause.
 */

/** Past this many seconds the worker (which polls every 15 s) is likely retrying, not just busy. */
const SLOW_AFTER_SECONDS = 60;

export function formatElapsed(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

export function isExportSlow(seconds: number): boolean {
  return seconds >= SLOW_AFTER_SECONDS;
}

export function exportFailureKey(code: string | null | undefined): "failed" | "failedScope" | "failedFilter" | "failedStorage" {
  if (code === "REPORT_SCOPE_FORBIDDEN") return "failedScope";
  if (code === "REPORT_FILTER_INVALID") return "failedFilter";
  if (code?.startsWith("DEPENDENCY_")) return "failedStorage";
  return "failed";
}
