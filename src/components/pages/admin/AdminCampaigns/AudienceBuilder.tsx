"use client";

import { UsersIcon } from "@heroicons/react/24/outline";
import { Button } from "@heroui/react";
import { useState } from "react";

import { adminService } from "@/service";
import { formatCount, parseAudienceDefinition } from "./normalize";

/**
 * Builds and previews the audience `definition`. The preview count it reports
 * upward is tied to the exact JSON that produced it, so the parent can refuse
 * to send when the definition has changed since the last preview.
 */
export function AudienceBuilder({
  definitionText,
  onDefinitionTextChange,
  onPreview,
}: Readonly<{
  definitionText: string;
  onDefinitionTextChange: (text: string) => void;
  onPreview: (result: { readonly definition: Record<string, unknown>; readonly count: number } | null) => void;
}>) {
  const [count, setCount] = useState<number | null>(null);
  const [sampleSize, setSampleSize] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runPreview = async () => {
    const parsed = parseAudienceDefinition(definitionText);
    if (!parsed.ok) {
      setError(parsed.error);
      setCount(null);
      setSampleSize(null);
      onPreview(null);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const preview = await adminService.previewAudience({ definition: parsed.value });
      const matched = typeof preview.matchedCount === "number" ? preview.matchedCount : 0;
      setCount(matched);
      setSampleSize(Array.isArray(preview.sample) ? preview.sample.length : null);
      onPreview({ definition: parsed.value, count: matched });
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "Không xem trước được tập khách.");
      setCount(null);
      setSampleSize(null);
      onPreview(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-admin-border bg-admin-surface p-4">
      <header className="flex items-center gap-2">
        <UsersIcon aria-hidden="true" className="size-5 text-admin-accent" />
        <h2 className="text-sm font-bold text-admin-ink">Tập khách nhận</h2>
      </header>

      <label className="flex flex-col gap-2 text-sm">
        <span className="font-semibold text-admin-ink">Định nghĩa tập khách (JSON)</span>
        <textarea
          className="min-h-32 rounded-lg border border-admin-border bg-admin-canvas px-3 py-2 font-mono text-xs text-admin-ink outline-none focus:border-admin-accent"
          value={definitionText}
          spellCheck={false}
          onChange={(event) => {
            onDefinitionTextChange(event.target.value);
            // Any edit invalidates a prior preview: the parent must not send
            // against a count that no longer matches the definition.
            setCount(null);
            setSampleSize(null);
            onPreview(null);
          }}
          placeholder='{ }'
        />
        <span className="text-xs text-admin-muted">
          Cấu trúc do backend quy định. Dùng {"{ }"} để nhắm toàn bộ khách, hoặc thêm điều kiện lọc theo schema tập khách.
        </span>
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          variant="outline"
          className="rounded-lg border-admin-border"
          isDisabled={busy}
          onPress={() => void runPreview()}
        >
          {busy ? "Đang xem trước…" : "Xem trước số người nhận"}
        </Button>
        {count !== null ? (
          <p className="text-sm text-admin-ink">
            Ước tính <strong className="text-admin-accent">{formatCount(count)}</strong> người nhận
            {sampleSize !== null ? (
              <span className="text-admin-muted"> · mẫu {formatCount(sampleSize)} bản ghi</span>
            ) : null}
          </p>
        ) : null}
      </div>

      {error ? (
        <p className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}
