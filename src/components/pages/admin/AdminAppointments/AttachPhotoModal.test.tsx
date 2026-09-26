import type { ReactElement, ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Appointment } from "./data";

const harness = vi.hoisted(() => ({ states: [] as unknown[], next: 0, upload: vi.fn(), confirm: vi.fn() }));
vi.mock("react", async (load) => ({ ...await load<typeof import("react")>(), useState: () => {
  const slot = harness.next++;
  return [harness.states[slot], (value: unknown) => { harness.states[slot] = value; }];
} }));
vi.mock("next-intl", () => ({ useTranslations: () => Object.assign((key: string) => key, { rich: (key: string) => key }) }));
vi.mock("@heroui/react", () => ({ Button: "button", Modal: Object.assign("dialog", { Backdrop: "backdrop", Container: "container", Dialog: "dialog", Header: "header", Heading: "h1", Body: "main", Footer: "footer" }) }));
vi.mock("@/service", () => ({ adminMediaService: { uploadFile: harness.upload } }));
import { AttachPhotoModal } from "./AttachPhotoModal";

type Element = ReactElement<{ children?: ReactNode; onPress?: () => void; isDisabled?: boolean; role?: string }>;
function find(node: ReactNode, predicate: (node: Element) => boolean): Element | undefined {
  if (Array.isArray(node)) return node.map((child) => find(child, predicate)).find(Boolean);
  if (node && typeof node === "object" && "props" in node) {
    const element = node as Element;
    return predicate(element) ? element : find(element.props.children, predicate);
  }
}
const image = { name: "proof.png", type: "image/png", size: 1200000 } as File;
function render(submitting = false) {
  harness.next = 0;
  const tree = AttachPhotoModal({ appointment: { customer: { name: "Fixture" } } as Appointment, onClose: vi.fn(), onConfirm: harness.confirm, submitting });
  return { tree, button: find(tree, (node) => Boolean(node.props.onPress) && ["photo.submit", "photo.busy"].includes(String(node.props.children)))! };
}
async function flush() { await Promise.resolve(); await Promise.resolve(); }
beforeEach(() => { vi.clearAllMocks(); harness.states = [image, "AFTER", "  proof note  ", false, null]; harness.upload.mockResolvedValue("uploaded-media-id"); });
describe("appointment photo uses the authenticated shared media upload", () => {
  it("attaches the completed upload id with selected kind and trimmed note", async () => {
    render().button.props.onPress!(); await flush();
    expect(harness.upload).toHaveBeenCalledWith(image);
    expect(harness.confirm).toHaveBeenCalledWith({ mediaId: "uploaded-media-id", kind: "AFTER", note: "proof note" });
  });
  it("retains the file/note on upload failure and retries the same form", async () => {
    harness.upload.mockRejectedValueOnce(new Error("Unauthorized upload"));
    render().button.props.onPress!(); await flush();
    expect(harness.confirm).not.toHaveBeenCalled();
    expect(harness.states[0]).toBe(image); expect(harness.states[2]).toBe("  proof note  "); expect(harness.states[3]).toBe(false);
    const retry = render(); expect(find(retry.tree, (node) => node.props.role === "alert")?.props.children).toBe("Unauthorized upload");
    retry.button.props.onPress!(); await flush();
    expect(harness.upload).toHaveBeenCalledTimes(2); expect(harness.confirm).toHaveBeenCalledTimes(1); expect(harness.states[4]).toBeNull();
  });
  it.each([["application/pdf", 1024, "photo.typeError"], ["image/png", 0, "photo.sizeError"], ["image/png", 10000001, "photo.sizeError"]])("retains file validation %s/%s", async (type, size, error) => {
    harness.states[0] = { ...image, type, size }; render().button.props.onPress!(); await flush();
    expect(harness.upload).not.toHaveBeenCalled(); expect(harness.confirm).not.toHaveBeenCalled(); expect(harness.states[4]).toBe(error);
  });
  it("does not upload while parent attachment submission is in progress", async () => {
    render(true).button.props.onPress!(); await flush(); expect(harness.upload).not.toHaveBeenCalled();
  });
});
