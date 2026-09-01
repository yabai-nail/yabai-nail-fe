import { toast } from "@heroui/react";

const SUCCESS_TOAST_TIMEOUT_MS = 3_500;

export function notifySuccess(title: string, description?: string) {
  return toast.success(title, {
    ...(description ? { description } : {}),
    timeout: SUCCESS_TOAST_TIMEOUT_MS,
  });
}
