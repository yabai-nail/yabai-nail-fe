import { describe, expect, it } from "vitest";
import { appendConversationMessage } from "./state";

describe("appendConversationMessage", () => {
  it("appends a message only to the selected conversation", () => {
    const initial = {
      cv1: [{ id: "m1", sender: "customer", content: "Xin chào", time: "10:00", sentAt: "2026-09-02T10:00:00+07:00" }],
    } as const;

    const result = appendConversationMessage(initial, "cv2", {
      id: "m2",
      sender: "salon",
      content: "Chào bạn",
      time: "Bây giờ",
      sentAt: "2026-09-02T10:01:00+07:00",
    });

    expect(result.cv1).toEqual(initial.cv1);
    expect(result.cv2).toHaveLength(1);
    expect(result.cv2[0]?.content).toBe("Chào bạn");
  });
});
