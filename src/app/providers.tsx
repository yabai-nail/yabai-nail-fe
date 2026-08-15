"use client";

import { I18nProvider } from "@heroui/react";
import { NextIntlClientProvider } from "next-intl";
import { ThemeProvider } from "next-themes";
import type { ReactNode } from "react";

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
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </I18nProvider>
    </NextIntlClientProvider>
  );
}
