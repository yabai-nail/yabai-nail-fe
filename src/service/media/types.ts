// Media upload lifecycle: request an upload URL, mark it complete when the
// bytes are written, delete the in-progress upload or the finished media,
// and sign a short-lived URL to read a finished media item.

export interface MediaUploadInput {
  readonly fileName: string;
  readonly contentType: "image/jpeg" | "image/png" | "image/webp";
  readonly sizeBytes: number;
}

export interface MediaUpload {
  readonly mediaId: string;
  readonly status: string;
  readonly uploadUrl: string;
  readonly expiresInSeconds: number;
  readonly requiredHeaders: Readonly<Record<string, string>>;
}

export interface MediaUploadCompleteInput {
  readonly etag?: string;
  readonly checksumSha256?: string;
}

export interface Media {
  readonly externalKey: string;
  readonly status: string;
  readonly payload: {
    readonly contentType?: string;
    readonly sizeBytes?: number;
    readonly fileName?: string;
  };
}

export interface MediaAccessUrl {
  readonly mediaId: string;
  readonly accessUrl: string;
  readonly expiresInSeconds: number;
}
