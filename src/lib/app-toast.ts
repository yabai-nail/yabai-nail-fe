import { toast } from "@heroui/react";

const SUCCESS_TOAST_TIMEOUT_MS = 3_500;
// Errors linger longer than successes so there is time to read what went wrong.
const ERROR_TOAST_TIMEOUT_MS = 6_000;

export function notifySuccess(title: string, description?: string) {
  return toast.success(title, {
    ...(description ? { description } : {}),
    timeout: SUCCESS_TOAST_TIMEOUT_MS,
  });
}

export function notifyError(title: string, description?: string) {
  return toast.danger(title, {
    ...(description ? { description } : {}),
    timeout: ERROR_TOAST_TIMEOUT_MS,
  });
}
