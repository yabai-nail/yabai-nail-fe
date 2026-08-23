import { describe, expect, it } from "vitest";

import { getApiOperation } from "../api";

// This file deliberately does NOT `vi.mock('../api')` — the existing
// service.test.ts mocks it to test loginAdmin's request-building, and
// that mock would hide whether the customer auth operation ids actually
// resolve. Coverage-locking against the real catalog is the whole point.

const CUSTOMER_AUTH_OPERATION_IDS = [
  "POST /api/v1/auth/phone/challenges",
  "POST /api/v1/auth/phone/challenges/{challengeId}/verify",
  "POST /api/v1/auth/recovery/phone/challenges",
  "POST /api/v1/auth/recovery/phone/challenges/{challengeId}/verify",
  "POST /api/v1/auth/sessions/refresh",
  "DELETE /api/v1/auth/sessions",
  "DELETE /api/v1/auth/sessions/current",
  "POST /api/v1/auth/social/{provider}/authorization",
  "POST /api/v1/auth/social/{provider}/callback",
  "POST /api/v1/auth/account-merges",
] as const;

describe("customer auth surface", () => {
  it("names an operation the runtime catalog knows about", () => {
    for (const id of CUSTOMER_AUTH_OPERATION_IDS) {
      expect(() => getApiOperation(id)).not.toThrow();
    }
  });
});
