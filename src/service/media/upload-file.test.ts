import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  executeApiOperation: vi.fn(),
  request: vi.fn(),
}));

vi.mock("../api", () => ({
  API_BASE_URL: "http://localhost:4000/api/v1",
  apiClient: { request: mocks.request },
  executeApiOperation: mocks.executeApiOperation,
}));

import { adminMediaService } from "./service";

const image = {
  name: "gel.webp",
  type: "image/webp",
  size: 1_024,
} as File;

describe("adminMediaService.uploadFile", () => {
  beforeEach(() => {
    mocks.executeApiOperation.mockReset();
    mocks.request.mockReset();
  });

  it("uploads bytes with admin auth and completes the media record", async () => {
    mocks.executeApiOperation.mockImplementation(async (operation: string) => {
      if (operation === "POST /api/v1/media/uploads") {
        return {
          mediaId: "media-1",
          status: "PENDING",
          uploadUrl: "http://localhost:4000/api/v1/media/uploads/media-1/content",
          expiresInSeconds: 600,
          requiredHeaders: { "Content-Type": "image/webp" },
        };
      }
      return { externalKey: "media-1", status: "READY", payload: {} };
    });
    mocks.request.mockResolvedValue({ headers: { etag: '"etag-1"' } });

    await expect(adminMediaService.uploadFile(image)).resolves.toBe("media-1");
    expect(mocks.request).toHaveBeenCalledWith(expect.objectContaining({
      method: "PUT",
      url: "/media/uploads/media-1/content",
      data: image,
      authScope: "admin",
    }));
    expect(mocks.executeApiOperation).toHaveBeenNthCalledWith(
      2,
      "POST /api/v1/media/uploads/{mediaId}/complete",
      expect.objectContaining({
        path: { mediaId: "media-1" },
        body: { etag: "etag-1" },
        authScope: "admin",
      }),
    );
  });

  it("aborts the pending media record if the byte upload fails", async () => {
    mocks.executeApiOperation.mockResolvedValueOnce({
      mediaId: "media-2",
      status: "PENDING",
      uploadUrl: "https://storage.example/signed",
      expiresInSeconds: 600,
      requiredHeaders: { "Content-Type": "image/webp" },
    });
    mocks.request.mockRejectedValue(new Error("upload failed"));

    await expect(adminMediaService.uploadFile(image)).rejects.toThrow("upload failed");
    expect(mocks.executeApiOperation).toHaveBeenLastCalledWith(
      "DELETE /api/v1/media/uploads/{mediaId}",
      expect.objectContaining({ path: { mediaId: "media-2" }, authScope: "admin" }),
    );
  });
});
