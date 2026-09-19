import { describe, expect, it } from "vitest";

import {
  MAX_AVATAR_IMAGE_BYTES,
  avatarInitials,
  mediaIdFromPublicUrl,
  validateAvatarImage,
} from "./avatar-image";

function file(type: string, size: number): File {
  return { type, size } as File;
}

describe("avatar image validation", () => {
  it.each(["image/jpeg", "image/png", "image/webp"])(
    "accepts %s images within the upload limit",
    (type) => {
      expect(validateAvatarImage(file(type, MAX_AVATAR_IMAGE_BYTES))).toBeNull();
    },
  );

  it("rejects formats the backend does not accept", () => {
    expect(validateAvatarImage(file("image/gif", 1_000))).toBe("unsupportedType");
  });

  it("rejects empty and oversized files", () => {
    expect(validateAvatarImage(file("image/jpeg", 0))).toBe("empty");
    expect(validateAvatarImage(file("image/jpeg", MAX_AVATAR_IMAGE_BYTES + 1))).toBe("tooLarge");
  });
});

describe("avatar media id extraction", () => {
  it("reads the id only from a stable same-origin public-content URL", () => {
    expect(mediaIdFromPublicUrl(
      "https://apiyabai.tedo.vn/api/v1/media/ac792d30/public-content",
      "https://apiyabai.tedo.vn/api/v1",
    )).toBe("ac792d30");
    expect(mediaIdFromPublicUrl(
      "https://evil.example/api/v1/media/ac792d30/public-content",
      "https://apiyabai.tedo.vn/api/v1",
    )).toBeNull();
    expect(mediaIdFromPublicUrl(
      "https://cdn.example/photo.webp",
      "https://apiyabai.tedo.vn/api/v1",
    )).toBeNull();
    expect(mediaIdFromPublicUrl(null, "https://apiyabai.tedo.vn/api/v1")).toBeNull();
  });
});

describe("avatar initials", () => {
  it("uses the first and last word for multi-word names", () => {
    expect(avatarInitials("Mai Linh")).toBe("ML");
  });

  it("takes two letters from a single word and falls back on blanks", () => {
    expect(avatarInitials("Yuki")).toBe("YU");
    expect(avatarInitials("   ")).toBe("?");
  });
});
