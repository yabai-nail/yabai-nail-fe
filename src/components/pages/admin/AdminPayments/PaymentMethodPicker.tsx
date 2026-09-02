import { BanknotesIcon, BuildingLibraryIcon, CreditCardIcon, EllipsisHorizontalIcon, QrCodeIcon } from "@heroicons/react/24/outline";
import { Radio, RadioGroup } from "@heroui/react";
import { useTranslations } from "next-intl";
import { paymentMethodLabel, type PaymentMethod } from "./data";

const methods = [
  { id: "cash", icon: BanknotesIcon },
  { id: "card", icon: CreditCardIcon },
  { id: "paypay", icon: QrCodeIcon },
  { id: "bank_transfer", icon: BuildingLibraryIcon },
  { id: "other", icon: EllipsisHorizontalIcon },
] as const;

export function PaymentMethodPicker({ value, isDisabled, onChange }: Readonly<{
  value: PaymentMethod | null;
  isDisabled: boolean;
  onChange: (method: PaymentMethod) => void;
}>) {
  const t = useTranslations("admin.payments");
  const tMethod = useTranslations("admin.paymentMethod");
  // The tile's padding lives on Radio.Content, the <label> that holds the input:
  // padding on the Radio wrapper is outside the label, so the edge of the tile
  // swallows clicks. The language switcher had the same shape and read as broken.
  //
  // `value` is passed straight through, including null — never `undefined`.
  // Undefined switches react-aria to uncontrolled mode, where it keeps its own
  // selection that can drift from the invoice. It drifted on the very first
  // option: "Tiền mặt" rendered as checked while `invoice.paymentMethod` was
  // still null, so clicking it produced no change event, no onChange, and a
  // confirm that silently did nothing. Cash being the most common method made
  // it the worst one to break. Controlled means the radio can only ever show
  // what the invoice actually holds.
  return (
    <RadioGroup aria-label={t("methodPicker.label")} value={value} onChange={(next) => onChange(next as PaymentMethod)} isDisabled={isDisabled} className="grid grid-cols-2 gap-2 sm:grid-cols-5">
      {methods.map(({ id, icon: Icon }) => <Radio key={id} value={id} className="rounded-lg border border-admin-border text-admin-muted data-[selected=true]:border-admin-accent data-[selected=true]:bg-admin-soft data-[selected=true]:text-admin-accent"><Radio.Content className="flex w-full cursor-pointer flex-col items-center gap-1 px-2 py-3 text-center text-xs"><Radio.Control className="sr-only"><Radio.Indicator /></Radio.Control><Icon aria-hidden="true" className="size-5" />{paymentMethodLabel(id, tMethod)}</Radio.Content></Radio>)}
    </RadioGroup>
  );
}

