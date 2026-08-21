import { AxiosError, type AxiosResponse } from "axios";
import { describe, expect, it } from "vitest";

import { ApiClientError, normalizeApiError, unwrapApiEnvelope } from "./contracts";

describe("API contracts", () => {
  it("unwraps the backend success envelope", () => {
    expect(
      unwrapApiEnvelope({
        data: [{ id: "branch-1" }],
        meta: {
          requestId: "request-1",
          serverTime: "2026-08-21T00:00:00.000Z",
          replayed: false,
        },
      }),
    ).toEqual([{ id: "branch-1" }]);
  });

  it("normalizes the backend error envelope", () => {
    const response = {
      status: 422,
      data: {
        error: {
          code: "VALIDATION_FAILED",
          message: "Dữ liệu không hợp lệ.",
          retryable: false,
        },
        meta: {
          requestId: "request-2",
          serverTime: "2026-08-21T00:00:00.000Z",
        },
      },
    } as AxiosResponse;

    const error = normalizeApiError(new AxiosError("Request failed", "ERR_BAD_REQUEST", undefined, undefined, response));

    expect(error).toBeInstanceOf(ApiClientError);
    expect(error).toMatchObject({
      code: "VALIDATION_FAILED",
      message: "Dữ liệu không hợp lệ.",
      requestId: "request-2",
      retryable: false,
      status: 422,
    });
  });
});
