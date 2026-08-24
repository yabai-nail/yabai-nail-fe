import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const startUpload = vi.fn();
const completeUpload = vi.fn();
const abortUpload = vi.fn();
const accessUrl = vi.fn();

vi.mock("@/service", () => ({
  mediaService: { startUpload, completeUpload, abortUpload, accessUrl },
}));

const { MAX_IMAGE_BYTES, rejectionReason, uploadDesignImage } = await import("./upload");

function fakeFile(
  overrides: Partial<{ name: string; type: string; size: number }> = {},
): File {
  return {
    name: overrides.name ?? "design.png",
    type: overrides.type ?? "image/png",
    size: overrides.size ?? 1024,
  } as File;
}

describe("rejectionReason", () => {
  it("accepts an image under the size cap", () => {
    expect(rejectionReason(fakeFile())).toBeNull();
  });

  it("rejects a non-image", () => {
    expect(rejectionReason(fakeFile({ type: "application/pdf" }))).toBe(
      "Chỉ chấp nhận tệp ảnh.",
    );
  });

  it("rejects an oversized image", () => {
    expect(rejectionReason(fakeFile({ size: MAX_IMAGE_BYTES + 1 }))).toBe(
      "Ảnh vượt quá 8 MB.",
    );
  });
});

describe("uploadDesignImage", () => {
  beforeEach(() => {
    startUpload.mockReset();
    completeUpload.mockReset();
    abortUpload.mockReset();
    accessUrl.mockReset();
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("runs start → bytes → complete → access-url and returns the durable id", async () => {
    startUpload.mockResolvedValue({ mediaId: "m-1", uploadUrl: "https://storage/put" });
    vi.mocked(fetch).mockResolvedValue({ ok: true, status: 200 } as Response);
    completeUpload.mockResolvedValue({ id: "m-1" });
    accessUrl.mockResolvedValue({ url: "https://cdn/m-1.png" });

    await expect(uploadDesignImage(fakeFile())).resolves.toEqual({
      mediaId: "m-1",
      url: "https://cdn/m-1.png",
    });

    expect(startUpload).toHaveBeenCalledWith({
      kind: "NAIL_DESIGN",
      contentType: "image/png",
      filename: "design.png",
      sizeBytes: 1024,
    });
    expect(completeUpload).toHaveBeenCalledWith("m-1");
    expect(abortUpload).not.toHaveBeenCalled();
  });

  it("PUTs the bytes to the pre-signed URL with the backend's own method and headers", async () => {
    const file = fakeFile();
    startUpload.mockResolvedValue({
      mediaId: "m-2",
      uploadUrl: "https://storage/post",
      method: "POST",
      headers: { "x-amz-acl": "private" },
    });
    vi.mocked(fetch).mockResolvedValue({ ok: true, status: 200 } as Response);
    completeUpload.mockResolvedValue({ id: "m-2" });
    accessUrl.mockResolvedValue({ url: "https://cdn/m-2.png" });

    await uploadDesignImage(file);

    expect(fetch).toHaveBeenCalledWith("https://storage/post", {
      method: "POST",
      headers: { "Content-Type": "image/png", "x-amz-acl": "private" },
      body: file,
    });
  });

  it("aborts the in-progress upload when the byte transfer fails", async () => {
    startUpload.mockResolvedValue({ mediaId: "m-3", uploadUrl: "https://storage/put" });
    vi.mocked(fetch).mockResolvedValue({ ok: false, status: 403 } as Response);
    abortUpload.mockResolvedValue(undefined);

    await expect(uploadDesignImage(fakeFile())).rejects.toThrow("HTTP 403");
    expect(abortUpload).toHaveBeenCalledWith("m-3");
    expect(completeUpload).not.toHaveBeenCalled();
  });

  it("surfaces the original failure even when the abort itself fails", async () => {
    startUpload.mockResolvedValue({ mediaId: "m-4", uploadUrl: "https://storage/put" });
    vi.mocked(fetch).mockResolvedValue({ ok: true, status: 200 } as Response);
    completeUpload.mockRejectedValue(new Error("complete refused"));
    abortUpload.mockRejectedValue(new Error("abort also refused"));

    await expect(uploadDesignImage(fakeFile())).rejects.toThrow("complete refused");
    expect(accessUrl).not.toHaveBeenCalled();
  });

  it("falls back to a generic content type when the browser reports none", async () => {
    startUpload.mockResolvedValue({ mediaId: "m-5", uploadUrl: "https://storage/put" });
    vi.mocked(fetch).mockResolvedValue({ ok: true, status: 200 } as Response);
    completeUpload.mockResolvedValue({ id: "m-5" });
    accessUrl.mockResolvedValue({ url: "https://cdn/m-5" });

    await uploadDesignImage(fakeFile({ type: "" }));

    expect(startUpload).toHaveBeenCalledWith(
      expect.objectContaining({ contentType: "application/octet-stream" }),
    );
  });
});
