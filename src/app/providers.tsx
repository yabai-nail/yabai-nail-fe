"use client";

import { I18nProvider } from "@heroui/react";
import { NextIntlClientProvider } from "next-intl";
import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";
import { SWRConfig } from "swr";

import { apiFetcher, AuthProvider } from "@/service";
import { AppToastProvider } from "@/components/overlays/AppToastProvider";

export interface AppProvidersProps {
  locale: string;
  messages: Record<string, unknown>;
  children: ReactNode;
}

export function AppProviders({
  locale,
  messages,
  children,
}: AppProvidersProps) {
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <I18nProvider locale={locale}>
        <SWRConfig value={{ fetcher: apiFetcher }}>
          <AuthProvider>
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
              {children}
              <AppToastProvider />
            </ThemeProvider>
          </AuthProvider>
        </SWRConfig>
      </I18nProvider>
    </NextIntlClientProvider>
  );
}
