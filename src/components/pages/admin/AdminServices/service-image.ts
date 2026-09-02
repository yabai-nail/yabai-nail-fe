export const MAX_SERVICE_IMAGE_BYTES = 10_000_000;

const ACCEPTED_SERVICE_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export type ServiceImageChange =
  | { readonly kind: "keep" }
  | { readonly kind: "remove" }
  | { readonly kind: "replace"; readonly mediaId: string };

export function validateServiceImage(file: Pick<File, "size" | "type">): string | null {
  if (!ACCEPTED_SERVICE_IMAGE_TYPES.has(file.type)) {
    return "Chỉ hỗ trợ ảnh JPG, PNG hoặc WebP.";
  }
  if (file.size === 0) return "Tệp ảnh đang trống.";
  if (file.size > MAX_SERVICE_IMAGE_BYTES) return "Ảnh không được vượt quá 10 MB.";
  return null;
}

export function serviceImagePatch(
  change: ServiceImageChange,
): { readonly imageMediaId?: string | null } {
  if (change.kind === "keep") return {};
  return { imageMediaId: change.kind === "remove" ? null : change.mediaId };
}

export function serviceMediaIdFromUrl(
  imageUrl: string | null | undefined,
  apiBaseUrl: string,
): string | null {
  if (!imageUrl) return null;
  try {
    const image = new URL(imageUrl);
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
