import axios from "axios";

export interface ApiMeta {
  readonly requestId: string;
  readonly serverTime: string;
  readonly replayed?: boolean;
}

export interface ApiEnvelope<T> {
  readonly data: T;
  readonly meta: ApiMeta;
}

export interface ApiErrorDetail {
  readonly code: string;
  readonly message: string;
  readonly fieldErrors?: unknown;
  readonly retryable?: boolean;
  readonly retryAfterSeconds?: number | null;
  readonly details?: unknown;
}

export interface ApiErrorEnvelope {
  readonly error: ApiErrorDetail;
  readonly meta?: ApiMeta;
}

export class ApiClientError extends Error {
  readonly status?: number;
  readonly code: string;
  readonly requestId?: string;
  readonly retryable: boolean;
  readonly details?: unknown;

  constructor(input: {
    message: string;
    code?: string;
    status?: number;
    requestId?: string;
    retryable?: boolean;
    details?: unknown;
  }) {
    super(input.message);
    this.name = "ApiClientError";
    this.code = input.code ?? "NETWORK_ERROR";
    this.status = input.status;
    this.requestId = input.requestId;
    this.retryable = input.retryable ?? true;
    this.details = input.details;
  }
}

export function unwrapApiEnvelope<T>(envelope: ApiEnvelope<T>): T {
  return envelope.data;
}

export function normalizeApiError(error: unknown): ApiClientError {
  if (error instanceof ApiClientError) return error;

  if (axios.isAxiosError<ApiErrorEnvelope>(error)) {
    const payload = error.response?.data;
    return new ApiClientError({
      message: payload?.error?.message ?? "Không thể kết nối đến máy chủ.",
      code: payload?.error?.code,
      status: error.response?.status,
      requestId: payload?.meta?.requestId,
      retryable: payload?.error?.retryable ?? !error.response,
      details: payload?.error?.details ?? payload?.error?.fieldErrors,
    });
  }

  return new ApiClientError({
    message: error instanceof Error ? error.message : "Đã xảy ra lỗi không xác định.",
  });
}
