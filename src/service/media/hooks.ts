"use client";

import { useApiOperation } from "../api";
import type { MediaAccessUrl } from "./types";

// Only the access-URL read has an SWR hook; the upload lifecycle is a
// three-step imperative flow (start → PUT/POST bytes → complete/abort)
// that a callback owns.

export function useMediaAccessUrl(mediaId: string | null) {
  return useApiOperation<MediaAccessUrl>(
    mediaId ? "GET /api/v1/media/{mediaId}/access-url" : null,
    { path: mediaId ? { mediaId } : undefined },
  );
}
