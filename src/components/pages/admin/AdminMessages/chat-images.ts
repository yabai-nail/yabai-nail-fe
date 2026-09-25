/** Photos one message may carry; the API refuses more. */
export const CHAT_IMAGE_LIMIT = 4;
/** The media upload API's own ceiling. */
export const MAX_CHAT_IMAGE_BYTES = 10_000_000;

const ACCEPTED_CHAT_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

/** A photo picked in the composer, not uploaded yet. */
export type ChatAttachment = {
  readonly id: string;
  readonly file: File;
  /** Object URL for the thumbnail; revoke it when the attachment goes away. */
  readonly previewUrl: string;
};

export function isValidChatImage(file: Pick<File, "size" | "type">): boolean {
  return ACCEPTED_CHAT_IMAGE_TYPES.has(file.type) && file.size > 0 && file.size <= MAX_CHAT_IMAGE_BYTES;
}

/**
 * Adds picked files to the pending attachments: invalid files and anything past the limit are
 * dropped, and the caller is told which of the two happened so it can say so.
 */
export function addChatAttachments(
  current: ReadonlyArray<ChatAttachment>,
  files: ReadonlyArray<File>,
  makeAttachment: (file: File) => ChatAttachment,
): { readonly attachments: ReadonlyArray<ChatAttachment>; readonly rejected: "invalid" | "limit" | null } {
  const valid = files.filter(isValidChatImage);
  const room = Math.max(0, CHAT_IMAGE_LIMIT - current.length);
  const accepted = valid.slice(0, room);
  const rejected = valid.length < files.length ? "invalid" : accepted.length < valid.length ? "limit" : null;
  return { attachments: [...current, ...accepted.map(makeAttachment)], rejected };
}
