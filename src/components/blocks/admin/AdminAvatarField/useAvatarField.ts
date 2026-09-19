"use client";

import { useCallback, useEffect, useState } from "react";
import { adminMediaService } from "@/service";
import { validateAvatarImage, type AvatarImageValidationError } from "./avatar-image";

/** `keep` leaves the stored image alone, `remove` clears it, `replace` uploads a new one. */
export type AvatarFieldMode = "keep" | "remove" | "replace";

export type AvatarFieldState = {
  /** The image the record already has, or null when it has none. */
  readonly currentUrl: string | null;
  readonly mode: AvatarFieldMode;
  readonly file: File | null;
  /** Object URL for the chosen file; only set while `mode` is `replace`. */
  readonly previewUrl: string | null;
  readonly error: AvatarImageValidationError | null;
  /** True when the current selection must not be submitted (bad file). */
  readonly blocked: boolean;
  readonly select: (file: File | null) => void;
  /** Drop a chosen replacement and go back to leaving the image as it was. */
  readonly clearReplacement: () => void;
  /** Mark the stored image for removal on save (only meaningful when one exists). */
  readonly remove: () => void;
  readonly undoRemove: () => void;
  /**
   * Uploads the chosen file when needed and returns the patch to merge into the mutate body.
   * `uploadedMediaId` is handed back so the caller can delete the orphan if the save then fails.
   */
  readonly resolve: () => Promise<{
    readonly patch: { readonly avatarMediaId?: string | null };
    readonly uploadedMediaId: string | null;
  }>;
};

/**
 * Holds the avatar picker's state for a create/edit modal. It mirrors the service-image flow —
 * validate on pick, upload on save, hand back the uploaded id for rollback — but stays circular
 * and compact, and defers to the caller's own busy/error handling.
 */
export function useAvatarField(currentUrl: string | null | undefined): AvatarFieldState {
  const initialUrl = currentUrl ?? null;
  const [mode, setMode] = useState<AvatarFieldMode>("keep");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<AvatarImageValidationError | null>(null);

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const select = useCallback((selected: File | null) => {
    if (!selected) return;
    const validationError = validateAvatarImage(selected);
    setError(validationError);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return validationError ? null : URL.createObjectURL(selected);
    });
    setFile(validationError ? null : selected);
    if (!validationError) setMode("replace");
  }, []);

  const clearReplacement = useCallback(() => {
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setFile(null);
    setError(null);
    setMode("keep");
  }, []);

  const remove = useCallback(() => setMode("remove"), []);
  const undoRemove = useCallback(() => setMode("keep"), []);

  const resolve = useCallback(async () => {
    if (mode === "remove") return { patch: { avatarMediaId: null }, uploadedMediaId: null };
    if (mode === "replace" && file) {
      const mediaId = await adminMediaService.uploadFile(file);
      return { patch: { avatarMediaId: mediaId }, uploadedMediaId: mediaId };
    }
    return { patch: {}, uploadedMediaId: null };
  }, [mode, file]);

  return {
    currentUrl: initialUrl,
    mode,
    file,
    previewUrl,
    error,
    blocked: error !== null || (mode === "replace" && file === null),
    select,
    clearReplacement,
    remove,
    undoRemove,
    resolve,
  };
}
