import { Switch } from "@heroui/react";

/**
 * The labelled on/off switch admin tables use for a row's status (categories, services,
 * add-ons): the track carries its own short label, so the row needs no second piece of text
 * saying the same thing. Read-only when `onToggle` is omitted.
 */
export function _AdminStatusSwitch({
  isOn,
  onToggle,
  isBusy = false,
  label,
  onText,
  offText,
}: Readonly<{
  isOn: boolean;
  onToggle?: () => void;
  isBusy?: boolean;
  /** Names the switch for screen readers, e.g. "Show or hide service X". */
  label: string;
  onText: string;
  offText: string;
}>) {
  return (
    <Switch isSelected={isOn} isDisabled={!onToggle || isBusy} onChange={() => onToggle?.()} aria-label={label}>
      <Switch.Content>
        {/* HeroUI slides the thumb with `margin-inline-start: calc(100% - 1.5rem)`, a percentage,
            so it still lands flush right at this width. The width is inline rather than a utility
            class because both are single-class selectors and the winner would depend on layer order. */}
        <Switch.Control style={{ width: "4.25rem" }}>
          <span aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center text-[0.625rem] font-semibold uppercase tracking-wide">
            {isOn ? (
              <span className="pl-2.5 text-admin-on-accent">{onText}</span>
            ) : (
              <span className="ml-auto pr-2.5 text-admin-muted">{offText}</span>
            )}
          </span>
          <Switch.Thumb />
        </Switch.Control>
      </Switch.Content>
    </Switch>
  );
}

export const meta = { world: "pure", domain: "admin-status-switch" } as const;
