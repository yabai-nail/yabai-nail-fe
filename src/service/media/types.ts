// Media upload lifecycle: request an upload URL, mark it complete when the
// bytes are written, delete the in-progress upload or the finished media,
// and sign a short-lived URL to read a finished media item.

export interface MediaUploadInput {
  readonly kind: string;
  readonly contentType: string;
  readonly filename?: string;
  readonly sizeBytes?: number;
  readonly checksum?: string;
  readonly [field: string]: unknown;
}

export interface MediaUpload {
  readonly mediaId: string;
  readonly uploadUrl: string;
  readonly method?: string;
  readonly headers?: Readonly<Record<string, string>>;
  readonly expiresAt: string;
  readonly [field: string]: unknown;
}

export interface MediaUploadCompleteInput {
  readonly checksum?: string;
  readonly [field: string]: unknown;
}

export interface Media {
  readonly id: string;
  readonly kind: string;
  readonly contentType: string;
  readonly sizeBytes?: number;
  readonly status: string;
  readonly createdAt: string;
  readonly [field: string]: unknown;
}

export interface MediaAccessUrl {
  readonly url: string;
  readonly expiresAt: string;
  readonly [field: string]: unknown;
}
