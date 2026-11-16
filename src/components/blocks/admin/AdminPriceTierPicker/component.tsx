"use client";

import { BookmarkIcon, CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";
import { useTranslations } from "next-intl";
import { useEffect, useId, useMemo, useState, type KeyboardEvent } from "react";

import { formatMoney } from "@/lib/admin-format";
import { isPinnedTier, nextActiveIndex, tierPickerResults, type SearchableTier } from "@/lib/price-tier-search";

/** Whether the tier list is there to pick from. */
export type PriceTierPickerStatus = "ready" | "loading" | "failed";

type AdminPriceTierPickerProps = {
  readonly label: string;
  readonly tiers: ReadonlyArray<SearchableTier>;
  readonly status?: PriceTierPickerStatus;
  /** The picked tier's id; "" when none is picked yet. */
  readonly value: string;
  readonly onChange: (tierId: string) => void;
  readonly isInvalid?: boolean;
  readonly describedBy?: string;
  /** Screen-specific wording for the list-level states; the picker's own wording otherwise. */
  readonly messages?: { readonly loading?: string; readonly failed?: string; readonly empty?: string };
  /** Most options rendered at once; the rest are reached by typing more. */
  readonly limit?: number;
};

const DEFAULT_LIMIT = 12;

export const priceTierOptionLabel = (tier: SearchableTier) => `${tier.name} · ${formatMoney(tier.amount)}`;

/**
 * Picks a price tier by typing part of its name or its amount. A plain dropdown listed every tier
 * in one long column; this lists pinned tiers first, shows a bounded number of matches, and keeps
 * the picked tier by id, so filtering or a re-order after a pin never changes what is picked.
 *
 * The ARIA editable combobox pattern: the text box owns focus, arrows move the highlighted option
 * (`aria-activedescendant`), Enter picks it, Escape closes the list without leaving a modal. The
 * list is drawn in the flow under the box rather than in a popover, so a modal body never clips it.
 */
export function AdminPriceTierPicker({
  label,
  tiers,
  status = "ready",
  value,
  onChange,
  isInvalid,
  describedBy,
  messages,
  limit = DEFAULT_LIMIT,
}: AdminPriceTierPickerProps) {
  const t = useTranslations("admin.priceTierPicker");
  const baseId = useId();
  const inputId = `${baseId}-input`;
  const listId = `${baseId}-list`;
  const optionId = (tierId: string) => `${baseId}-option-${tierId}`;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(-1);
  const selected = tiers.find((tier) => tier.id === value);
  const { items, total } = useMemo(() => tierPickerResults(tiers, query, limit), [tiers, query, limit]);
  const activeTier = open ? items[active] : undefined;

  useEffect(() => {
    if (activeTier) document.getElementById(optionId(activeTier.id))?.scrollIntoView?.({ block: "nearest" });
    // optionId only depends on baseId, which never changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTier]);

  if (status === "loading") return <p role="status" className="text-xs text-admin-muted">{messages?.loading ?? t("loading")}</p>;
  if (status === "failed") return <p role="alert" className="text-xs text-admin-danger">{messages?.failed ?? t("failed")}</p>;
  if (tiers.length === 0) return <p role="status" className="text-xs text-admin-muted">{messages?.empty ?? t("empty")}</p>;

  // Highlight the picked tier when it is among the matches, so Enter keeps the current pick.
  const highlightFor = (nextQuery: string) => {
    const matches = tierPickerResults(tiers, nextQuery, limit).items;
    const index = matches.findIndex((tier) => tier.id === value);
    return index >= 0 ? index : matches.length > 0 ? 0 : -1;
  };
  const openList = () => {
    setOpen(true);
    setQuery("");
    setActive(highlightFor(""));
  };
  const close = () => {
    setOpen(false);
    setQuery("");
    setActive(-1);
  };
  const choose = (tier: SearchableTier) => {
    onChange(tier.id);
    close();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) openList();
      else setActive((current) => nextActiveIndex(event.key, current, items.length) ?? current);
    } else if (event.key === "Enter" && open) {
      // Never submit the surrounding form while the list is open.
      event.preventDefault();
      if (activeTier) choose(activeTier);
    } else if (event.key === "Escape" && open) {
      // Closing the list must not also close the modal the picker sits in.
      event.preventDefault();
      event.stopPropagation();
      close();
    }
  };

  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={inputId} className="text-xs font-semibold text-admin-muted">{label}</label>
      <div className="relative">
        <input
          id={inputId}
          type="text"
          role="combobox"
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={listId}
          aria-activedescendant={activeTier ? optionId(activeTier.id) : undefined}
          aria-invalid={isInvalid || undefined}
          aria-describedby={describedBy}
          className={`min-h-10 w-full rounded-lg border bg-admin-surface pl-3 pr-9 text-sm text-admin-ink placeholder:text-admin-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin-accent ${
            isInvalid ? "border-admin-danger" : "border-admin-border"
          }`}
          placeholder={t("placeholder")}
          value={open ? query : selected ? priceTierOptionLabel(selected) : ""}
          onFocus={() => { if (!open) openList(); }}
          onClick={() => { if (!open) openList(); }}
          onBlur={close}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
            setActive(highlightFor(event.target.value));
          }}
          onKeyDown={onKeyDown}
        />
        <ChevronUpDownIcon aria-hidden className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-admin-muted" />
      </div>
      <ul
        id={listId}
        role="listbox"
        aria-label={label}
        hidden={!open}
        className="max-h-64 overflow-y-auto rounded-lg border border-admin-border bg-admin-surface p-1"
      >
        {items.map((tier, index) => {
          const isSelected = tier.id === value;
          return (
            <li
              key={tier.id}
              id={optionId(tier.id)}
              role="option"
              aria-selected={isSelected}
              // Keep focus in the text box, so the list does not close before the pick lands.
              onMouseDown={(event) => event.preventDefault()}
              onMouseMove={() => setActive(index)}
              onClick={() => choose(tier)}
              className={`flex min-h-9 cursor-pointer items-center gap-2 rounded-md px-2 text-sm text-admin-ink ${
                index === active ? "bg-admin-soft" : ""
              }`}
            >
              <CheckIcon aria-hidden className={`size-4 shrink-0 text-admin-accent ${isSelected ? "" : "invisible"}`} />
              <span className="min-w-0 flex-1 truncate">{tier.name}</span>
              {isPinnedTier(tier) ? (
                <span className="inline-flex shrink-0 items-center gap-0.5 text-xs text-admin-muted">
                  <BookmarkIcon aria-hidden className="size-3.5 text-admin-accent" />
                  {t("pinned")}
                </span>
              ) : null}
              <span className="shrink-0 font-semibold tabular-nums">{formatMoney(tier.amount)}</span>
            </li>
          );
        })}
      </ul>
      {open && items.length === 0 ? (
        <p className="px-1 text-xs text-admin-muted">{t("noMatch", { query: query.trim() })}</p>
      ) : null}
      {open && total > items.length ? (
        <p className="px-1 text-xs text-admin-muted">{t("more", { shown: items.length, total })}</p>
      ) : null}
      {/* Announces how many tiers match as the query changes. */}
      <span role="status" className="sr-only">{open ? t("results", { count: total }) : ""}</span>
    </div>
  );
}

export const meta = { world: "pure", domain: "admin-price-tier-picker" } as const;
