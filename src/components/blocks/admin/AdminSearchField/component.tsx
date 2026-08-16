import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { InputGroup } from "@heroui/react";

type AdminSearchFieldProps = {
  readonly label: string;
  readonly placeholder: string;
  readonly value: string;
  readonly onChange: (value: string) => void;
};

export function _AdminSearchField({
  label,
  placeholder,
  value,
  onChange,
}: AdminSearchFieldProps) {
  return (
    <InputGroup className="w-full sm:w-64" fullWidth>
      <InputGroup.Prefix>
        <MagnifyingGlassIcon aria-hidden="true" className="size-4 text-admin-muted" />
      </InputGroup.Prefix>
      <InputGroup.Input
        type="search"
        aria-label={label}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </InputGroup>
  );
}

export const meta = { world: "pure", domain: "admin-search-field" } as const;
