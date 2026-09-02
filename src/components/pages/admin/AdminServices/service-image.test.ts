import { describe, expect, it } from "vitest";

import {
  MAX_SERVICE_IMAGE_BYTES,
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
