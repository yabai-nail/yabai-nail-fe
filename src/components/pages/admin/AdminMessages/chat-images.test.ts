import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { addChatAttachments, CHAT_IMAGE_LIMIT, isValidChatImage, type ChatAttachment } from "./chat-images";
import { toChatMessage } from "./component";

const file = (type: string, size = 1000) => ({ type, size, name: "a" }) as unknown as File;
const make = (picked: File): ChatAttachment => ({ id: String(Math.random()), file: picked, previewUrl: "blob:x" });

describe("chat photo attachments", () => {
  it("accepts JPG, PNG and WebP up to 10 MB only", () => {
    expect(isValidChatImage(file("image/jpeg"))).toBe(true);
    expect(isValidChatImage(file("image/gif"))).toBe(false);
    expect(isValidChatImage(file("image/png", 0))).toBe(false);
    expect(isValidChatImage(file("image/webp", 10_000_001))).toBe(false);
  });

  it("stops at the per-message limit and reports what was dropped", () => {
    const three = addChatAttachments([], [file("image/png"), file("image/png"), file("image/png")], make);
    expect(three).toMatchObject({ rejected: null });
    const capped = addChatAttachments(three.attachments, [file("image/png"), file("image/png")], make);
    expect(capped.attachments).toHaveLength(CHAT_IMAGE_LIMIT);
    expect(capped.rejected).toBe("limit");
    expect(addChatAttachments([], [file("application/pdf")], make)).toMatchObject({ attachments: [], rejected: "invalid" });
  });

  it("maps an IMAGE message's photos onto the text bubble", () => {
    const message = toChatMessage({ id: "m1", conversationId: "c1", senderType: "CUSTOMER", messageType: "IMAGE", content: "", images: [{ mediaId: "p1", url: "https://signed/p1" }], createdAt: "2026-09-26T10:00:00Z" }, () => "10:00");
    expect(message).toMatchObject({ kind: "text", sender: "customer", content: "", images: [{ mediaId: "p1", url: "https://signed/p1" }] });
  });

  it("offers an attach control and keeps the new copy in every locale", () => {
    const thread = readFileSync(join(process.cwd(), "src/components/pages/admin/AdminMessages/MessageThread.tsx"), "utf8");
    expect(thread).toContain('t("attachPhoto")');
    expect(thread).toContain("<ChatImages");
    for (const locale of ["vi", "en", "ja"]) {
      const messages = JSON.parse(readFileSync(join(process.cwd(), "messages", `${locale}.json`), "utf8")).admin.messages;
      for (const key of ["attachPhoto", "attachedPhotos", "removePhoto", "photoAlt", "openPhoto", "photoUnavailable", "photoPreview", "photoInvalid", "photoLimit"]) {
        expect(messages[key], `${locale}.${key}`).toBeTruthy();
      }
    }
  });
});
