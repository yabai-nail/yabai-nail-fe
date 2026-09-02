import { describe, expect, it } from "vitest";

import { getApiOperation } from "../api";
import { adminMediaService, mediaService, toUploadRequestUrl } from "./service";

const MEDIA_OPERATION_IDS = [
  "POST /api/v1/media/uploads",
  "POST /api/v1/media/uploads/{mediaId}/complete",
  "DELETE /api/v1/media/uploads/{mediaId}",
  "DELETE /api/v1/media/{mediaId}",
  "GET /api/v1/media/{mediaId}/access-url",
] as const;

describe("mediaService", () => {
  it("names an operation the runtime catalog knows about", () => {
    for (const id of MEDIA_OPERATION_IDS) {
      expect(() => getApiOperation(id)).not.toThrow();
    }
  });

  it("exposes a function for each media operation", () => {
    for (const service of [mediaService, adminMediaService]) {
      for (const fn of [
        service.startUpload,
        service.completeUpload,
        service.abortUpload,
        service.deleteMedia,
        service.accessUrl,
        service.uploadFile,
      ]) {
        expect(typeof fn).toBe("function");
      }
    }
  });

  it("uses a relative URL for uploads targeting this API so auth is retained", () => {
    expect(
      toUploadRequestUrl(
        "http://localhost:4000/api/v1/media/uploads/media-1/content",
        "http://localhost:4000/api/v1",
      ),
    ).toBe("/media/uploads/media-1/content");
  });

  it("leaves third-party signed upload URLs absolute so auth is not leaked", () => {
    const signed = "https://storage.example/private/media-1?signature=secret";
    expect(toUploadRequestUrl(signed, "http://localhost:4000/api/v1")).toBe(signed);
  });
});
