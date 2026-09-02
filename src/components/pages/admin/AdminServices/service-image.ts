export const MAX_SERVICE_IMAGE_BYTES = 10_000_000;

const ACCEPTED_SERVICE_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export function validateServiceImage(file: Pick<File, "size" | "type">): string | null {
  if (!ACCEPTED_SERVICE_IMAGE_TYPES.has(file.type)) {
    return "Chỉ hỗ trợ ảnh JPG, PNG hoặc WebP.";
  }
  if (file.size === 0) return "Tệp ảnh đang trống.";
  if (file.size > MAX_SERVICE_IMAGE_BYTES) return "Ảnh không được vượt quá 10 MB.";
  return null;
}
