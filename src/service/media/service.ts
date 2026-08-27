import { executeApiOperation, type AuthScope } from "../api";
import type {
  Media,
  MediaAccessUrl,
  MediaUpload,
  MediaUploadCompleteInput,
  MediaUploadInput,
} from "./types";

const createMediaService = (authScope: AuthScope) => ({
  startUpload: (input: MediaUploadInput, idempotencyKey?: string) =>
    executeApiOperation<MediaUpload>("POST /api/v1/media/uploads", {
      body: input,
      idempotencyKey,
      authScope,
    }),
  completeUpload: (
    mediaId: string,
    input?: MediaUploadCompleteInput,
    idempotencyKey?: string,
  ) =>
    executeApiOperation<Media>("POST /api/v1/media/uploads/{mediaId}/complete", {
      path: { mediaId },
      body: input ?? {},
      idempotencyKey,
      authScope,
    }),
  abortUpload: (mediaId: string) =>
    executeApiOperation<void>("DELETE /api/v1/media/uploads/{mediaId}", {
      path: { mediaId },
      authScope,
    }),
  deleteMedia: (mediaId: string) =>
    executeApiOperation<void>("DELETE /api/v1/media/{mediaId}", {
      path: { mediaId },
      authScope,
    }),
  accessUrl: (mediaId: string) =>
    executeApiOperation<MediaAccessUrl>("GET /api/v1/media/{mediaId}/access-url", {
      path: { mediaId },
      authScope,
    }),
});

export const mediaService = createMediaService("customer");
export const adminMediaService = createMediaService("admin");
