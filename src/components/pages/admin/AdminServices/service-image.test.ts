import { describe, expect, it } from "vitest";

import {
  MAX_SERVICE_IMAGE_BYTES,
  serviceImagePatch,
  serviceMediaIdFromUrl,
  validateServiceImage,
} from "./service-image";

function file(type: string, size: number): File {
  return { type, size } as File;
}

describe("service image validation", () => {
  it.each(["image/jpeg", "image/png", "image/webp"])(
    "accepts %s images within the upload limit",
    (type) => {
      expect(validateServiceImage(file(type, MAX_SERVICE_IMAGE_BYTES))).toBeNull();
    },
  );

  it("rejects formats the backend does not accept", () => {
    expect(validateServiceImage(file("image/gif", 1_000))).toBe(
      "Chỉ hỗ trợ ảnh JPG, PNG hoặc WebP.",
    );
  });

  it("rejects empty and oversized files", () => {
    expect(validateServiceImage(file("image/jpeg", 0))).toBe(
      "Tệp ảnh đang trống.",
    );
    expect(validateServiceImage(file("image/jpeg", MAX_SERVICE_IMAGE_BYTES + 1))).toBe(
      "Ảnh không được vượt quá 10 MB.",
    );
  });
});

describe("service image edits", () => {
  it("omits image fields when the existing photo is unchanged", () => {
    expect(serviceImagePatch({ kind: "keep" })).toEqual({});
  });

  it("uses imageMediaId for replacements and null for removals", () => {
    expect(serviceImagePatch({ kind: "replace", mediaId: "media-2" })).toEqual({
      imageMediaId: "media-2",
    });
    expect(serviceImagePatch({ kind: "remove" })).toEqual({ imageMediaId: null });
  });

  it("extracts an old media id only from stable public service-image URLs", () => {
    expect(serviceMediaIdFromUrl(
      "https://apiyabai.tedo.vn/api/v1/media/ac792d30/public-content",
      "https://apiyabai.tedo.vn/api/v1",
    )).toBe("ac792d30");
    expect(serviceMediaIdFromUrl(
      "https://evil.example/api/v1/media/ac792d30/public-content",
      "https://apiyabai.tedo.vn/api/v1",
    )).toBeNull();
    expect(serviceMediaIdFromUrl(
      "https://cdn.example/photo.webp",
      "https://apiyabai.tedo.vn/api/v1",
    )).toBeNull();
    expect(serviceMediaIdFromUrl(null, "https://apiyabai.tedo.vn/api/v1")).toBeNull();
  });
});
