import type { AxiosRequestConfig } from "axios";

import {
  API_BASE_URL,
  apiClient,
  executeApiOperation,
  type AuthScope,
} from "../api";
import type {
  Media,
  MediaAccessUrl,
  MediaUpload,
  MediaUploadCompleteInput,
  MediaUploadInput,
} from "./types";

export function toUploadRequestUrl(uploadUrl: string, apiBaseUrl = API_BASE_URL): string {
  try {
    const upload = new URL(uploadUrl);
    const api = new URL(apiBaseUrl);
    const apiPath = api.pathname.replace(/\/$/, "");
    if (
      upload.origin === api.origin &&
      (upload.pathname === apiPath || upload.pathname.startsWith(`${apiPath}/`))
    ) {
      return `${upload.pathname.slice(apiPath.length) || "/"}${upload.search}`;
    }
  } catch {
    // The backend owns this value; leave a non-URL untouched so Axios reports it consistently.
  }
  return uploadUrl;
}

const createMediaService = (authScope: AuthScope) => {
  const startUpload = (input: MediaUploadInput, idempotencyKey?: string) =>
    executeApiOperation<MediaUpload>("POST /api/v1/media/uploads", {
      body: input,
      idempotencyKey,
      authScope,
    });
  const completeUpload = (
    mediaId: string,
    input?: MediaUploadCompleteInput,
    idempotencyKey?: string,
  ) =>
    executeApiOperation<Media>("POST /api/v1/media/uploads/{mediaId}/complete", {
      path: { mediaId },
      body: input ?? {},
      idempotencyKey,
      authScope,
    });
  const abortUpload = (mediaId: string) =>
    executeApiOperation<void>("DELETE /api/v1/media/uploads/{mediaId}", {
      path: { mediaId },
      authScope,
    });
  const deleteMedia = (mediaId: string) =>
    executeApiOperation<void>("DELETE /api/v1/media/{mediaId}", {
      path: { mediaId },
      authScope,
    });
  const accessUrl = (mediaId: string) =>
    executeApiOperation<MediaAccessUrl>("GET /api/v1/media/{mediaId}/access-url", {
      path: { mediaId },
      authScope,
    });

  const uploadFile = async (file: File): Promise<string> => {
    let mediaId: string | null = null;
    try {
      const upload = await startUpload({
        fileName: file.name,
        contentType: file.type as MediaUploadInput["contentType"],
        sizeBytes: file.size,
      });
      mediaId = upload.mediaId;
      const requestConfig: AxiosRequestConfig<File> & { authScope: AuthScope } = {
        method: "PUT",
        url: toUploadRequestUrl(upload.uploadUrl),
        data: file,
        headers: upload.requiredHeaders,
        timeout: 60_000,
        authScope,
      };
      const response = await apiClient.request(requestConfig);
      const rawEtag = response.headers.etag;
      await completeUpload(
        mediaId,
        typeof rawEtag === "string" ? { etag: rawEtag.replaceAll('"', "") } : undefined,
      );
      return mediaId;
    } catch (error) {
      if (mediaId) {
        try {
          await abortUpload(mediaId);
        } catch {
          // Preserve the upload error; orphan cleanup can be retried by server maintenance.
        }
      }
      throw error;
    }
  };

  return {
    startUpload,
    completeUpload,
    abortUpload,
    deleteMedia,
    accessUrl,
    uploadFile,
  };
};

export const mediaService = createMediaService("customer");
export const adminMediaService = createMediaService("admin");
