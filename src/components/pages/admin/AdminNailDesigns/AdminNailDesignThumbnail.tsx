"use client";

import { PhotoIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";

import { adminMediaService } from "@/service";

export function AdminNailDesignThumbnail({ mediaId, alt }: Readonly<{ mediaId?: string; alt: string }>) {
  const [resolved, setResolved] = useState<{ mediaId: string; url: string } | null>(null);

  useEffect(() => {
    let active = true;
    if (mediaId) {
      void adminMediaService.accessUrl(mediaId).then((result) => {
        if (active) setResolved({ mediaId, url: result.accessUrl });
      }).catch(() => {
        if (active) setResolved(null);
      });
    }
    return () => { active = false; };
  }, [mediaId]);

  const url = resolved && resolved.mediaId === mediaId ? resolved.url : null;
  if (!url) {
    return <span className="grid size-12 shrink-0 place-items-center rounded-lg bg-admin-soft text-admin-accent"><PhotoIcon aria-hidden className="size-5" /></span>;
  }

  // Access URLs are short-lived remote URLs and should bypass the Next optimizer.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt={alt} className="size-12 shrink-0 rounded-lg border border-admin-border object-cover" />;
}
