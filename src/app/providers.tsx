"use client";

import { I18nProvider } from "@heroui/react";
import { NextIntlClientProvider } from "next-intl";
import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";
import { SWRConfig } from "swr";

import { apiFetcher, AuthProvider } from "@/service";
import { AppToastProvider } from "@/components/overlays/AppToastProvider";
import { DEFAULT_TIME_ZONE } from "@/i18n/config";

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
    <NextIntlClientProvider locale={locale} timeZone={DEFAULT_TIME_ZONE} messages={messages}>
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
