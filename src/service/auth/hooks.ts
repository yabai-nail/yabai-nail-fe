"use client";

import { useApiOperation } from "../api";
import type { AdminSessionSummary } from "./types";

// Bootstrap the current admin session after a reload. Pass `false` to keep the
// hook idle when the caller hasn't signed in yet — otherwise SWR would fire an
// unauthorised request on the sign-in screen.
export function useAdminSession(enabled = true) {
  return useApiOperation<AdminSessionSummary>(
    enabled ? "GET /api/v1/admin/auth/session" : null,
  );
}
