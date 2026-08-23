import { executeApiOperation } from "../api";
import type {
  Media,
  MediaAccessUrl,
  MediaUpload,
  MediaUploadCompleteInput,
  MediaUploadInput,
} from "./types";

export const mediaService = {
  startUpload: (input: MediaUploadInput, idempotencyKey?: string) =>
    executeApiOperation<MediaUpload>("POST /api/v1/media/uploads", {
      body: input,
      idempotencyKey,
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
    }),
  abortUpload: (mediaId: string) =>
    executeApiOperation<void>("DELETE /api/v1/media/uploads/{mediaId}", {
      path: { mediaId },
    }),
  deleteMedia: (mediaId: string) =>
    executeApiOperation<void>("DELETE /api/v1/media/{mediaId}", { path: { mediaId } }),
  accessUrl: (mediaId: string) =>
    executeApiOperation<MediaAccessUrl>("GET /api/v1/media/{mediaId}/access-url", {
      path: { mediaId },
    }),
};
