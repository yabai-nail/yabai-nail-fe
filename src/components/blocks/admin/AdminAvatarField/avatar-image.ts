// Avatar uploads reuse the same media pipeline as service images, but the images are shown at
// thumbnail size, so the ceiling is lower than the 10 MB services allow.
export const MAX_AVATAR_IMAGE_BYTES = 5_000_000;

const ACCEPTED_AVATAR_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export type AvatarImageValidationError = "empty" | "tooLarge" | "unsupportedType";

export function validateAvatarImage(file: Pick<File, "size" | "type">): AvatarImageValidationError | null {
  if (!ACCEPTED_AVATAR_IMAGE_TYPES.has(file.type)) {
    return "unsupportedType";
  }
  if (file.size === 0) return "empty";
  if (file.size > MAX_AVATAR_IMAGE_BYTES) return "tooLarge";
  return null;
}

/**
 * The media id inside a public-content URL (`.../media/{id}/public-content`), or null when the URL
 * is empty or points elsewhere. Used to clean up the old image after a replace or remove.
 */
export function mediaIdFromPublicUrl(url: string | null | undefined, apiBaseUrl: string): string | null {
  if (!url) return null;
  try {
    const image = new URL(url);
    const api = new URL(apiBaseUrl);
    if (image.origin !== api.origin) return null;
    const apiPath = api.pathname.replace(/\/$/, "");
    const mediaPath = `${apiPath}/media/`;
    if (!image.pathname.startsWith(mediaPath)) return null;
    const match = image.pathname.slice(mediaPath.length).match(/^([^/]+)\/public-content\/?$/);
    return match ? decodeURIComponent(match[1]) : null;
  } catch {
    return null;
  }
}

/** Two initials for the fallback badge, mirroring how the roster derives them. */
export function avatarInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase();
}
