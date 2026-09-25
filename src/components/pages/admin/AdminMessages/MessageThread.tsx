import { useFormatter, useTranslations } from "next-intl";
import {
  ArchiveBoxIcon,
  BookmarkIcon,
  BookmarkSlashIcon,
  CalendarDaysIcon,
  ChatBubbleLeftRightIcon,
  CheckCircleIcon,
  PaperAirplaneIcon,
  PhoneIcon,
  PhotoIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { Avatar, Button, InputGroup } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, type FormEvent } from "react";
import type { ChatMessage, MessageCustomer } from "./data";
import { CHAT_IMAGE_LIMIT, type ChatAttachment } from "./chat-images";
import { MessageActionsMenu } from "./MessageActionsMenu";
import { BookingConfirmationCard } from "./BookingConfirmationCard";
import { WarrantyNoticeCard } from "./WarrantyNoticeCard";
import { AppointmentCancellationCard } from "./AppointmentCancellationCard";
import { PaymentRecordedCard } from "./PaymentRecordedCard";
import { groupThread } from "./thread";
import { useAdminPermission } from "@/service";

type MessageThreadProps = {
  readonly customer: MessageCustomer;
  readonly messages: ReadonlyArray<ChatMessage>;
  readonly draft: string;
  readonly onDraftChange: (value: string) => void;
  /** Photos picked in the composer, uploaded only when the message is sent. */
  readonly attachments?: ReadonlyArray<ChatAttachment>;
  readonly onAttachPhotos?: (files: ReadonlyArray<File>) => void;
  readonly onRemovePhoto?: (id: string) => void;
  /** Per-message recall / delete-for-me. Hidden (with copy) when omitted. */
  readonly onMessageAction?: (action: "recall" | "hide", messageId: string) => Promise<void>;
  readonly onSend: () => void;
  readonly canWrite: boolean;
  /** Fired when the admin marks the current thread read. Hidden if omitted. */
  readonly onMarkRead?: () => void;
  /** Fired when the admin archives or restores the current thread. Hidden if omitted. */
  readonly onArchive?: () => void;
  readonly archived?: boolean;
  readonly pinned?: boolean;
  /** Fired when the admin toggles the pin on the current thread. Hidden if omitted. */
  readonly onTogglePin?: () => void;
  readonly pinPending?: boolean;
  readonly statusPending?: boolean;
  readonly statusError?: string | null;
  readonly sendPending?: boolean;
  readonly sendError?: string | null;
};

/**
 * One bubble. The corner facing the speaker's own edge is squared off, which is
 * the convention that makes a stack of boxes read as a conversation; within a
 * run only the last bubble keeps its tail, so three quick replies look like one
 * turn rather than three.
 */
function Bubble({
  message,
  isLast,
  onMessageAction,
}: Readonly<{ message: ChatMessage; isLast: boolean; onMessageAction?: (action: "recall" | "hide", messageId: string) => Promise<void> }>) {
  const t = useTranslations("admin.messages");
  if (message.kind === "booking-confirmation") {
    return <BookingConfirmationCard booking={message.booking} />;
  }
  if (message.kind === "warranty-notice") {
    return <WarrantyNoticeCard warranty={message.warranty} />;
  }
  if (message.kind === "appointment-cancelled") {
    return <AppointmentCancellationCard cancellation={message.cancellation} />;
  }
  if (message.kind === "payment-recorded") {
    return <PaymentRecordedCard payment={message.payment} />;
  }
  const fromSalon = message.sender === "salon";
  const tail = fromSalon
    ? isLast ? "rounded-br-sm" : ""
    : isLast ? "rounded-bl-sm" : "";
  const menu = onMessageAction ? <MessageActionsMenu message={message} onAction={onMessageAction} /> : null;
  if (message.recalled) {
    return (
      <div className={`group flex max-w-[min(34rem,78%)] items-center gap-1 ${fromSalon ? "flex-row-reverse" : ""}`}>
        <div className={`rounded-2xl border border-dashed border-admin-border px-3.5 py-2 text-sm italic text-admin-muted ${tail}`}>
          {t("recalledMessage")}
        </div>
        {menu}
      </div>
    );
  }
  return (
    // The menu sits on the inner side of the bubble and shows on hover or keyboard focus.
    <div className={`group flex w-full items-center gap-1 ${fromSalon ? "flex-row-reverse" : ""}`}>
      <div className={`flex min-w-0 max-w-[min(34rem,78%)] flex-col gap-0.5 ${fromSalon ? "items-end" : "items-start"}`}>
        {message.images?.length ? <ChatImages images={message.images} /> : null}
        {message.content ? (
          <div
            className={`rounded-2xl px-3.5 py-2 text-sm leading-relaxed break-words ${tail} ${
              fromSalon
                ? "bg-admin-accent text-admin-on-accent"
                : "border border-admin-border bg-admin-surface text-admin-ink"
            }`}
          >
            {message.content}
          </div>
        ) : null}
      </div>
      {menu}
    </div>
  );
}

/** A message's photos. Each opens full size in a new tab; the signed link needs no login. */
function ChatImages({ images }: Readonly<{ images: NonNullable<Extract<ChatMessage, { kind: "text" }>["images"]> }>) {
  const t = useTranslations("admin.messages");
  return (
    <div className={`grid w-80 max-w-full gap-1 ${images.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
      {images.map((image, index) =>
        image.url ? (
          <a
            key={image.mediaId}
            href={image.url}
            target="_blank"
            rel="noreferrer"
            aria-label={t("openPhoto", { index: index + 1 })}
            className="block overflow-hidden rounded-xl border border-admin-border bg-admin-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-accent"
          >
            {/* Signed or blob URL: nothing the Next image optimizer could fetch. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image.url} alt={t("photoAlt", { index: index + 1 })} className={`w-full object-cover ${images.length > 1 ? "aspect-square" : "max-h-72"}`} loading="lazy" />
          </a>
        ) : (
          <div key={image.mediaId} className="grid aspect-square place-items-center rounded-xl border border-admin-border bg-admin-soft">
            <PhotoIcon aria-label={t("photoUnavailable")} className="size-6 text-admin-muted" />
          </div>
        ),
      )}
    </div>
  );
}

export function MessageThread({
  customer,
  messages,
  draft,
  onDraftChange,
  attachments = [],
  onAttachPhotos,
  onRemovePhoto,
  onMessageAction,
  onSend,
  canWrite,
  onMarkRead,
  onArchive,
  archived = false,
  pinned,
  onTogglePin,
  pinPending = false,
  statusPending = false,
  statusError = null,
  sendPending = false,
  sendError = null,
}: MessageThreadProps) {
  const t = useTranslations("admin.messages");
  const format = useFormatter();
  const router = useRouter();
  const canCreateAppointment = useAdminPermission("appointment.create.branch");
  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSend();
  };
  const days = groupThread(messages, new Date(), {
    today: t("today"),
    yesterday: t("yesterday"),
    formatDate: (date) => format.dateTime(date, { dateStyle: "medium" }),
  });

  /*
    Land on the newest message, the way every chat client does. This became
    necessary the moment the thread started scrolling inside itself: without it,
    opening a long conversation drops you at its oldest message and you scroll
    down to find out what was actually said.

    Keyed on the conversation and the message count, so it fires when you switch
    threads and again when a message arrives — but not while you are reading
    back through the history.
  */
  const scroller = useRef<HTMLOListElement>(null);
  const newestMessageId = messages.at(-1)?.id;
  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [customer.id, messages.length, newestMessageId]);

  return (
    <section aria-labelledby="thread-heading" className="flex min-h-0 min-w-0 flex-col bg-admin-canvas">
      {/*
        The customer's name, number and the two things you would do about them
        all sit here. They used to be a third column 304px wide that repeated
        the name, printed an empty phone row, and held these two buttons.
      */}
      <header className="flex shrink-0 flex-wrap items-center gap-3 border-b border-admin-border bg-admin-surface px-4 py-3">
        <Avatar size="sm" color="accent" className="shrink-0">
          <Avatar.Fallback>{customer.initials}</Avatar.Fallback>
        </Avatar>
        {/* min-w-[9rem], not min-w-0: the actions are shrink-0, so a name block
            that can shrink to nothing hands them the whole row and gets its
            text cut instead. With a floor the header wraps the actions onto a
            second line, which is the thing that should give. */}
        <div className="min-w-[9rem] flex-1">
          <h2 id="thread-heading" className="truncate text-sm font-bold text-admin-ink">
            {customer.name}
          </h2>
          {customer.phone ? (
            <p className="truncate text-xs text-admin-muted">{customer.phone}</p>
          ) : (
            <p className="truncate text-xs text-admin-muted">{t("noPhone")}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <Button
            size="sm"
            variant="outline"
            className="rounded-lg border-admin-border"
            isDisabled={!customer.phone}
            onPress={() => { window.location.href = `tel:${customer.phone}`; }}
          >
            <PhoneIcon className="size-4" />{t("call")}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="rounded-lg border-admin-accent bg-admin-soft text-admin-accent"
            isDisabled={!canCreateAppointment}
            onPress={() => router.push("/admin/appointments?create=1")}
          >
            <CalendarDaysIcon className="size-4" />{t("createAppointment")}
          </Button>
          {onTogglePin ? (
            <Button size="sm" variant="ghost" onPress={onTogglePin} isDisabled={pinPending} aria-label={pinned ? t("unpin") : t("pin")}>
              {pinned ? <BookmarkSlashIcon className="size-4" /> : <BookmarkIcon className="size-4" />}
            </Button>
          ) : null}
          {onMarkRead ? (
            <Button size="sm" variant="ghost" onPress={onMarkRead} isDisabled={statusPending} aria-label={t("markRead")}>
              <CheckCircleIcon className="size-4" />
            </Button>
          ) : null}
          {onArchive ? (
            <Button size="sm" variant="ghost" onPress={onArchive} isDisabled={statusPending} aria-label={archived ? t("restore") : t("archive")}>
              <ArchiveBoxIcon className="size-4" />
            </Button>
          ) : null}
        </div>
      </header>
      {statusError ? (
        <p role="alert" className="border-b border-admin-border bg-admin-surface px-4 py-2 text-xs text-admin-danger">
          {statusError}
        </p>
      ) : null}

      {days.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
          <ChatBubbleLeftRightIcon className="size-8 text-admin-border" />
          <p className="text-sm font-semibold text-admin-ink">{t("noMessages")}</p>
          <p className="max-w-xs text-xs text-admin-muted">
            {t("emptyThread", { name: customer.name })}
          </p>
        </div>
      ) : (
        <ol ref={scroller} aria-label={t("threadLabel", { name: customer.name })} className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-5">
          {days.map((day) => (
            <li key={day.key || "khong-ro-ngay"}>
              {day.label ? (
                <p className="mb-4 flex items-center gap-3 text-[0.68rem] font-medium text-admin-muted">
                  <span aria-hidden="true" className="h-px flex-1 bg-admin-border" />
                  {day.label}
                  <span aria-hidden="true" className="h-px flex-1 bg-admin-border" />
                </p>
              ) : null}
              <ol className="space-y-4">
                {day.runs.map((run) => {
                  const fromSalon = run.sender === "salon";
                  const fromSystem = run.sender === "system";
                  const last = run.messages[run.messages.length - 1];
                  return (
                    <li
                      key={run.messages[0].id}
                      className={`flex flex-col gap-0.5 ${fromSystem ? "items-center" : fromSalon ? "items-end" : "items-start"}`}
                    >
                      {run.messages.map((message) => (
                        <Bubble key={message.id} message={message} isLast={message.id === last.id} onMessageAction={onMessageAction} />
                      ))}
                      {/* One timestamp for the run. It used to sit inside every
                          bubble on a line of its own, which is why a message
                          reading "2" was 54px wide and 70px tall. */}
                      <time
                        className={`px-1 text-[0.65rem] text-admin-muted ${fromSystem ? "text-center" : ""}`}
                      >
                        {last.time}
                      </time>
                    </li>
                  );
                })}
              </ol>
            </li>
          ))}
        </ol>
      )}

      <form onSubmit={submit} className="shrink-0 border-t border-admin-border bg-admin-surface p-3">
        {sendError ? <p role="alert" className="mb-2 text-xs text-admin-danger">{sendError}</p> : null}
        {attachments.length ? (
          <ul aria-label={t("attachedPhotos")} className="mb-2 flex flex-wrap gap-2">
            {attachments.map((attachment, index) => (
              <li key={attachment.id} className="relative size-16 overflow-hidden rounded-lg border border-admin-border bg-admin-soft">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={attachment.previewUrl} alt={t("photoAlt", { index: index + 1 })} className="size-full object-cover" />
                <button
                  type="button"
                  onClick={() => onRemovePhoto?.(attachment.id)}
                  disabled={sendPending}
                  aria-label={t("removePhoto", { index: index + 1 })}
                  className="absolute right-0.5 top-0.5 grid size-5 place-items-center rounded-full bg-admin-ink/70 text-white hover:bg-admin-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-accent"
                >
                  <XMarkIcon aria-hidden className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        <div className="flex items-center gap-2">
          {onAttachPhotos ? (
            <label
              title={t("attachPhoto")}
              className={`grid size-9 shrink-0 place-items-center rounded-lg border border-admin-border text-admin-muted focus-within:ring-2 focus-within:ring-admin-accent ${
                !canWrite || sendPending || attachments.length >= CHAT_IMAGE_LIMIT ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:bg-admin-soft hover:text-admin-accent"
              }`}
            >
              <PhotoIcon aria-hidden className="size-5" />
              <span className="sr-only">{t("attachPhoto")}</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="sr-only"
                disabled={!canWrite || sendPending || attachments.length >= CHAT_IMAGE_LIMIT}
                onChange={(event) => {
                  onAttachPhotos(Array.from(event.target.files ?? []));
                  event.target.value = "";
                }}
              />
            </label>
          ) : null}
          <InputGroup fullWidth>
            <InputGroup.Input aria-label={t("composeLabel")} maxLength={2000} disabled={!canWrite} placeholder={t("composeTo", { name: customer.name })} value={draft} onChange={(event) => onDraftChange(event.target.value)} />
            <InputGroup.Suffix><Button type="submit" size="sm" variant="primary" isDisabled={!canWrite || (!draft.trim() && attachments.length === 0) || sendPending} className="rounded-lg"><PaperAirplaneIcon className="size-4" />{sendPending ? t("sending") : t("send")}</Button></InputGroup.Suffix>
          </InputGroup>
        </div>
      </form>
    </section>
  );
}
