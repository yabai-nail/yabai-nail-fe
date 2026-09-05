"use client";

import { Card, Radio, RadioGroup } from "@heroui/react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

import { APPEARANCES, selectedAppearance } from "./appearance";

const subscribeToHydration = () => () => undefined;
const getClientHydrationSnapshot = () => true;
const getServerHydrationSnapshot = () => false;

/**
 * next-themes owns the choice: it stores it in localStorage and puts `.dark` on
 * <html>, and the admin token block in globals.css answers to that class. Nothing
 * here reaches the backend -- like the language, this is a preference of the
 * browser the console is open in, not of the account.
 */
export function AppearanceSettings() {
  const t = useTranslations("admin.settings.appearance");
  const { theme, setTheme } = useTheme();
  // The guard ShellNav uses for its sun/moon icon, for the same reason: the server
  // render and the first client render must agree, and only the client can read
  // localStorage. Until then the group is disabled, because a click it cannot act
  // on is worse than a short wait.
  const isReady = useSyncExternalStore(
    subscribeToHydration,
    getClientHydrationSnapshot,
    getServerHydrationSnapshot,
  );
  const value = selectedAppearance(theme, isReady);

  return (
    <Card className="mt-4 rounded-lg border-admin-border bg-admin-surface shadow-none">
      <Card.Content className="p-6">
        <h2 className="font-bold text-admin-ink">{t("heading")}</h2>
        <p className="mt-2 text-sm text-admin-muted">{t("description")}</p>

        <RadioGroup
          aria-label={t("legend")}
          className="mt-5 gap-3"
          isDisabled={!isReady}
          value={value}
          onChange={setTheme}
        >
          {APPEARANCES.map((option) => (
            <Radio
              key={option}
              value={option}
              className="rounded-lg border border-admin-border data-[selected=true]:border-admin-accent data-[selected=true]:bg-admin-soft"
            >
              {/*
                Padding and indicator inside Radio.Content, the <label> that holds the
                input, so the whole card is the click target. LanguageSettings explains
                what it looked like when they sat outside.
              */}
              <Radio.Content className="flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-sm font-semibold text-admin-muted data-[selected=true]:text-admin-accent">
                <Radio.Control>
                  <Radio.Indicator />
                </Radio.Control>
                <span className="flex flex-col gap-0.5">
                  <span>{t(`options.${option}`)}</span>
                  <span className="text-xs font-normal text-admin-muted">{t(`hints.${option}`)}</span>
                </span>
              </Radio.Content>
            </Radio>
          ))}
        </RadioGroup>
      </Card.Content>
    </Card>
  );
}
