"use client";

import { ArrowUturnLeftIcon, DocumentDuplicateIcon, EllipsisHorizontalIcon, TrashIcon } from "@heroicons/react/24/outline";
import { Button, Dropdown, Modal } from "@heroui/react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { notifySuccess } from "@/lib/app-toast";
import type { ChatTextMessage } from "./data";
import { availableMessageActions, type MessageActionKey } from "./message-actions";

/**
 * The "⋯" menu beside a bubble: copy the text, recall it for both sides, or hide it from this
 * admin's view. Recall and hide ask first, the way chat apps do; copy just copies.
 */
export function MessageActionsMenu({
  message,
  onAction,
}: Readonly<{
  message: ChatTextMessage;
  onAction: (action: "recall" | "hide", messageId: string) => Promise<void>;
}>) {
  const t = useTranslations("admin.messages.messageActions");
  const [confirming, setConfirming] = useState<"recall" | "hide" | null>(null);
  const [busy, setBusy] = useState(false);
  // Read the clock outside render; refreshed each time the menu opens so recall drops off at 15 min.
  const [now, setNow] = useState(() => Date.now());
  const actions = availableMessageActions(message, now);
  if (actions.length === 0) return null;

  const icons: Record<MessageActionKey, typeof TrashIcon> = { copy: DocumentDuplicateIcon, recall: ArrowUturnLeftIcon, hide: TrashIcon };

  const choose = (key: MessageActionKey) => {
    if (key === "copy") {
      void navigator.clipboard?.writeText(message.content).then(() => notifySuccess(t("copied")), () => undefined);
      return;
    }
    setConfirming(key);
  };

  const confirm = async () => {
    if (!confirming || busy) return;
    setBusy(true);
    try {
      await onAction(confirming, message.id);
      setConfirming(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Dropdown onOpenChange={(open) => { if (open) setNow(Date.now()); }}>
        <Dropdown.Trigger
          aria-label={t("menu")}
          className="grid size-7 shrink-0 place-items-center rounded-full text-admin-muted opacity-0 outline-none transition-opacity hover:bg-admin-soft hover:text-admin-ink focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-admin-accent group-hover:opacity-100 aria-expanded:opacity-100"
        >
          <EllipsisHorizontalIcon aria-hidden className="size-5" />
        </Dropdown.Trigger>
        <Dropdown.Popover placement="bottom" className="admin-shell">
          <Dropdown.Menu aria-label={t("menu")} onAction={(key) => choose(String(key) as MessageActionKey)}>
            {actions.map((key) => {
              const Icon = icons[key];
              return (
                <Dropdown.Item key={key} id={key} textValue={t(key)} className={key === "copy" ? "" : "text-admin-danger"}>
                  <span className="flex items-center gap-2 text-sm">
                    <Icon aria-hidden className="size-4" />
                    {t(key)}
                  </span>
                </Dropdown.Item>
              );
            })}
          </Dropdown.Menu>
        </Dropdown.Popover>
      </Dropdown>

      {confirming ? (
        <Modal isOpen onOpenChange={(open) => { if (!open && !busy) setConfirming(null); }}>
          <Modal.Backdrop>
            <Modal.Container size="sm" placement="center">
              <Modal.Dialog>
                <Modal.Header className="border-b border-admin-border px-5 py-4">
                  <Modal.Heading className="text-base font-bold text-admin-ink">{t(`${confirming}Title`)}</Modal.Heading>
                </Modal.Header>
                <Modal.Body className="px-5 py-5 text-sm leading-6 text-admin-ink">{t(`${confirming}Confirm`)}</Modal.Body>
                <Modal.Footer className="flex justify-end gap-2 border-t border-admin-border px-5 py-3">
                  <Button variant="ghost" className="rounded-lg" isDisabled={busy} onPress={() => setConfirming(null)}>{t("cancel")}</Button>
                  <Button variant="ghost" className="rounded-lg bg-admin-danger text-white hover:bg-admin-danger/90" isDisabled={busy} onPress={() => void confirm()}>
                    {busy ? t("working") : t(confirming)}
                  </Button>
                </Modal.Footer>
              </Modal.Dialog>
            </Modal.Container>
          </Modal.Backdrop>
        </Modal>
      ) : null}
    </>
  );
}
