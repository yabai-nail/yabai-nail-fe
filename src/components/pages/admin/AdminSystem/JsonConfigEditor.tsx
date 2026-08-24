"use client";

import { Button, Card } from "@heroui/react";
import { useState, type ReactNode } from "react";

import { parseConfigObject, stringifyConfig } from "./normalize";

/**
 * Shared editor for the two open-ended config documents (system-config,
 * loyalty-config). The backend owns their exact shape and it is not fully
 * modelled in the type layer, so — rather than invent fields — the editor
 * exposes the whole document as validated JSON and lets the caller render a
 * friendly read-only summary above it. The textarea is the single source of
 * truth; `version` is stripped for editing and passed back for optimistic
 * concurrency (If-Match) on save.
 */
export function JsonConfigEditor({
  config,
  version,
  isLoading,
  loadError,
  onSave,
  summary,
  heading,
  description,
}: Readonly<{
  config: Readonly<Record<string, unknown>> | undefined;
  version: number | undefined;
  isLoading: boolean;
  loadError: string | null;
  onSave: (body: Record<string, unknown>, version: number | undefined) => Promise<void>;
  summary?: ReactNode;
  heading: string;
  description: string;
}>) {
  // The editor's value is DERIVED from the server config until the admin types.
  // `draft === null` means "showing server state" — a background revalidate then
  // flows straight through without an effect (and without clobbering unsaved
  // work, because once they type `draft` holds their text). Saving resets it to
  // null so the freshly mutated config becomes the new baseline.
  const [draft, setDraft] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const text = draft ?? stringifyConfig(config);
  const dirty = draft !== null;

  const save = async () => {
    const parsed = parseConfigObject(text);
    if (!parsed.ok) {
      setError(parsed.error);
      return;
    }
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      await onSave(parsed.value, version);
      setDraft(null);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error && err.message ? err.message : "Không lưu được cấu hình.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="mt-4 rounded-lg border-admin-border bg-admin-surface shadow-none">
      <Card.Header className="flex flex-col gap-1 border-b border-admin-border px-5 py-4">
        <h2 className="text-base font-bold text-admin-ink">{heading}</h2>
        <p className="text-xs text-admin-muted">{description}</p>
      </Card.Header>
      <Card.Content className="flex flex-col gap-4 p-5">
        {loadError ? (
          <p role="alert" className="rounded-lg bg-danger/10 px-3 py-2 text-xs text-danger">
            {loadError}
          </p>
        ) : null}

        {isLoading ? (
          <p className="text-sm text-admin-muted">Đang tải cấu hình…</p>
        ) : (
          <>
            {summary ? <div className="flex flex-col gap-2">{summary}</div> : null}

            <label className="flex flex-col gap-2 text-sm">
              <span className="font-semibold text-admin-ink">Cấu hình (JSON)</span>
              <textarea
                className="min-h-64 rounded-lg border border-admin-border bg-admin-canvas px-3 py-2 font-mono text-xs text-admin-ink outline-none focus:border-admin-accent"
                value={text}
                spellCheck={false}
                onChange={(event) => {
                  setDraft(event.target.value);
                  setSaved(false);
                }}
              />
              <span className="text-xs text-admin-muted">
                Chỉnh trực tiếp tài liệu cấu hình. Trường <code>version</code> do hệ thống quản lý,
                không cần nhập.
              </span>
            </label>

            {error ? (
              <p role="alert" className="rounded-lg bg-danger/10 px-3 py-2 text-xs text-danger">
                {error}
              </p>
            ) : null}
            {saved ? (
              <p className="rounded-lg bg-admin-soft px-3 py-2 text-xs text-admin-accent">
                Đã lưu cấu hình.
              </p>
            ) : null}

            <div className="flex items-center gap-3">
              <Button
                variant="primary"
                className="rounded-lg"
                isDisabled={busy || !dirty}
                onPress={() => void save()}
              >
                {busy ? "Đang lưu…" : "Lưu cấu hình"}
              </Button>
              {typeof version === "number" ? (
                <span className="text-xs text-admin-muted">Phiên bản hiện tại: {version}</span>
              ) : null}
            </div>
          </>
        )}
      </Card.Content>
    </Card>
  );
}
