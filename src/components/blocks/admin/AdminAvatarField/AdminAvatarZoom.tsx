"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Avatar, Modal } from "@heroui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { avatarInitials } from "./avatar-image";

type AvatarSize = "sm" | "md" | "lg";

// A read-only avatar that enlarges its image in a lightbox on click. With no image it renders the
// initials fallback and is inert, so it is safe to drop into a table cell or a detail header.
export function AdminAvatarZoom({
  src,
  name,
  size = "sm",
  className,
}: Readonly<{
  src: string | null | undefined;
  name: string;
  size?: AvatarSize;
  className?: string;
}>) {
  const t = useTranslations("admin.avatar");
  const [open, setOpen] = useState(false);
  const initials = avatarInitials(name || "?");
  const hasImage = Boolean(src);

  const badge = (
    <Avatar size={size} color="accent" className={className}>
      {src ? <Avatar.Image src={src} alt={name} className="object-cover" /> : null}
      <Avatar.Fallback>{initials}</Avatar.Fallback>
    </Avatar>
  );

  if (!hasImage) {
    return <span className="inline-flex shrink-0">{badge}</span>;
  }

  return (
    <>
      <button
        type="button"
        aria-label={t("zoomOpen", { name })}
        className="inline-flex shrink-0 rounded-full transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-accent"
        onClick={(event) => {
          // Table rows use their own click-to-select; zooming must not also select the row.
          event.stopPropagation();
          setOpen(true);
        }}
      >
        {badge}
      </button>
      {open ? (
        <Modal isOpen onOpenChange={(next) => { if (!next) setOpen(false); }}>
          <Modal.Backdrop>
            <Modal.Container size="md" placement="center">
              <Modal.Dialog>
                <Modal.Header className="flex flex-row items-center justify-between border-b border-admin-border px-5 py-3">
                  <Modal.Heading className="truncate text-sm font-bold text-admin-ink">{name}</Modal.Heading>
                  <button
                    type="button"
                    aria-label={t("close")}
                    className="rounded-lg p-1.5 text-admin-muted hover:bg-admin-soft hover:text-admin-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-accent"
                    onClick={() => setOpen(false)}
                  >
                    <XMarkIcon aria-hidden className="size-5" />
                  </button>
                </Modal.Header>
                <Modal.Body className="flex justify-center bg-admin-soft p-4">
                  {/* Public media endpoint; a plain img avoids the Next optimizer for a one-off preview. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src ?? ""}
                    alt={t("alt", { name })}
                    className="max-h-[70vh] w-auto max-w-full rounded-xl object-contain"
                  />
                </Modal.Body>
              </Modal.Dialog>
            </Modal.Container>
          </Modal.Backdrop>
        </Modal>
      ) : null}
    </>
  );
}
