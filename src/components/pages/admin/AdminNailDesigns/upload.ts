import { mediaService } from "@/service";

/**
 * Drives the three-step media lifecycle for one design image.
 *
 * `src/service/media` deliberately ships no hook for this: its own comment says
 * the upload lifecycle is "a three-step imperative flow (start → PUT/POST bytes
 * → complete/abort) that a callback owns". This is that callback.
 *
 *   1. `POST /api/v1/media/uploads`                    → `{ mediaId, uploadUrl, method?, headers? }`
 *   2. raw bytes to `uploadUrl` (plain `fetch`, never the axios client — the
 *      upload URL is pre-signed storage, and attaching the admin bearer to it
 *      would leak the token to a third-party host)
 *   3. `POST /api/v1/media/uploads/{mediaId}/complete` → the finished `Media`
 *   4. `GET  /api/v1/media/{mediaId}/access-url`       → the URL the grid renders
 *
 * If step 2 or 3 fails the in-progress upload is aborted so the backend is not
 * left holding a half-written media row. The abort is best-effort: its own
 * failure must not mask the error the caller actually needs to see.
 *
 * `kind` is not observed on the wire — every media request body is
 * `{ type: "object", additionalProperties: true }` in runtime Swagger, and the
 * whole media API is bearer-only so no unauthenticated probe can reveal the
 * enum. It is a parameter rather than a buried constant precisely so a wrong
 * guess is one edit away from correct; a rejected value surfaces the backend's
 * own message instead of being swallowed.
 */
export async function uploadDesignImage(
  file: File,
  kind = "NAIL_DESIGN",
): Promise<{ readonly mediaId: string; readonly url: string }> {
  const upload = await mediaService.startUpload({
    kind,
    contentType: file.type || "application/octet-stream",
    filename: file.name,
    sizeBytes: file.size,
  });

  try {
    const response = await fetch(upload.uploadUrl, {
      method: upload.method ?? "PUT",
      headers: {
        "Content-Type": file.type || "application/octet-stream",
        ...(upload.headers ?? {}),
      },
      body: file,
    });

    if (!response.ok) {
      throw new Error(`Tải ảnh lên thất bại (HTTP ${response.status}).`);
    }

    await mediaService.completeUpload(upload.mediaId);
  } catch (error) {
    await mediaService.abortUpload(upload.mediaId).catch(() => undefined);
    throw error;
  }

  const access = await mediaService.accessUrl(upload.mediaId);
  return { mediaId: upload.mediaId, url: access.url };
}

/** Images only, and small enough that a salon phone upload stays interactive. */
export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

export function rejectionReason(file: File): string | null {
  if (!file.type.startsWith("image/")) return "Chỉ chấp nhận tệp ảnh.";
  if (file.size > MAX_IMAGE_BYTES) return "Ảnh vượt quá 8 MB.";
  return null;
}
