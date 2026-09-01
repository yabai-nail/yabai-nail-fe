"use client";

import { Toast } from "@heroui/react";

export function AppToastProvider() {
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
