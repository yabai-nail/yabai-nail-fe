"use client";

import { Toast } from "@heroui/react";
import { useEffect } from "react";

import { notifyError } from "@/lib/app-toast";
import { setMutationErrorNotifier } from "@/service";

export function AppToastProvider() {
  // Let the API client raise admin write failures as a toast. Registered here because this is
  // the toast host; the client only fires it for admin mutations (see client.ts).
  useEffect(() => {
    setMutationErrorNotifier((error) => {
      const message = error instanceof Error && error.message ? error.message : "Đã xảy ra lỗi.";
      notifyError(message);
    });
    return () => setMutationErrorNotifier(null);
  }, []);

  return (
    <Toast.Provider
      className="app-toast-region"
      placement="top end"
      gap={10}
      maxVisibleToasts={3}
      width="min(24rem, calc(100vw - 2rem))"
    />
  );
}
