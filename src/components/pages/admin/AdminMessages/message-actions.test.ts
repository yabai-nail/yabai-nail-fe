import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { ChatTextMessage } from "./data";
import { availableMessageActions, RECALL_WINDOW_MS } from "./message-actions";
import { toChatMessage } from "./component";

const now = Date.parse("2026-09-26T10:00:00Z");
const message = (patch: Partial<ChatTextMessage>): ChatTextMessage => ({
  id: "m1", kind: "text", sender: "salon", content: "Chào chị", time: "09:59", sentAt: new Date(now - 60_000).toISOString(), ...patch,
});

describe("per-message actions", () => {
  it("offers copy, recall and hide on a fresh salon message", () => {
    expect(availableMessageActions(message({}), now)).toEqual(["copy", "recall", "hide"]);
  });

  it("stops offering recall after 15 minutes and never on a customer message", () => {
    expect(availableMessageActions(message({ sentAt: new Date(now - RECALL_WINDOW_MS - 1).toISOString() }), now)).toEqual(["copy", "hide"]);
    expect(availableMessageActions(message({ sender: "customer" }), now)).toEqual(["copy", "hide"]);
  });

  it("has nothing to copy on a photo-only message, only hide once recalled, nothing while sending", () => {
    expect(availableMessageActions(message({ content: "", images: [{ mediaId: "p" }] }), now)).toEqual(["recall", "hide"]);
    expect(availableMessageActions(message({ recalled: true, content: "" }), now)).toEqual(["hide"]);
    expect(availableMessageActions(message({ id: "local-1" }), now)).toEqual([]);
  });

  it("maps a recalled server message onto the placeholder", () => {
    expect(toChatMessage({ id: "m2", conversationId: "c", senderType: "STAFF", messageType: "TEXT", content: "", recalledAt: "2026-09-26T10:00:00Z", createdAt: "2026-09-26T09:58:00Z" }, () => "09:58")).toMatchObject({ kind: "text", recalled: true });
  });

  it("wires the menu into the thread and keeps the copy in every locale", () => {
    const thread = readFileSync(join(process.cwd(), "src/components/pages/admin/AdminMessages/MessageThread.tsx"), "utf8");
    expect(thread).toContain("<MessageActionsMenu");
    expect(thread).toContain('t("recalledMessage")');
    for (const locale of ["vi", "en", "ja"]) {
      const messages = JSON.parse(readFileSync(join(process.cwd(), "messages", `${locale}.json`), "utf8")).admin.messages;
      expect(messages.recalledMessage).toBeTruthy();
      for (const key of ["menu", "copy", "recall", "hide", "copied", "recallTitle", "recallConfirm", "hideTitle", "hideConfirm", "cancel", "working", "recalled", "hidden", "recallExpired", "recallForbidden", "failed"]) {
        expect(messages.messageActions[key], `${locale}.${key}`).toBeTruthy();
      }
    }
  });
});
