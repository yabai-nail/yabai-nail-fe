"use client";

import { PhotoIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";

import { adminMediaService } from "@/service";

/**
 * A design's cover, by stable public URL when the API has derived one (`imageUrl`), else by
 * private media id resolved through a short-lived access URL (`mediaId`).
 *
 * The private path only works for whoever uploaded the photo, and used to be the only path:
 * every other admin saw an empty tile, and so did the uploader once the URL expired. Design
 * photos are catalogue images, so the public URL is the normal case now; the id path stays for
 * customer proposals, whose photos really are private uploads.
 */
export function AdminNailDesignThumbnail({ imageUrl, mediaId, alt }: Readonly<{ imageUrl?: string | null; mediaId?: string; alt: string }>) {
  const [resolved, setResolved] = useState<{ mediaId: string; url: string } | null>(null);

  useEffect(() => {
    let active = true;
    if (mediaId && !imageUrl) {
      void adminMediaService.accessUrl(mediaId).then((result) => {
        if (active) setResolved({ mediaId, url: result.accessUrl });
      }).catch(() => {
        if (active) setResolved(null);
      });
    }
    return () => { active = false; };
  }, [mediaId, imageUrl]);

  const url = imageUrl ?? (resolved && resolved.mediaId === mediaId ? resolved.url : null);
  if (!url) {
    return <span className="grid size-12 shrink-0 place-items-center rounded-lg bg-admin-soft text-admin-accent"><PhotoIcon aria-hidden className="size-5" /></span>;
  }

  // Access URLs are short-lived remote URLs and should bypass the Next optimizer.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt={alt} className="size-12 shrink-0 rounded-lg border border-admin-border object-cover" />;
}
