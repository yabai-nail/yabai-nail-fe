import { BanknotesIcon, BuildingLibraryIcon, CreditCardIcon, EllipsisHorizontalIcon, QrCodeIcon } from "@heroicons/react/24/outline";
import { Radio, RadioGroup } from "@heroui/react";
import { paymentMethodLabels, type PaymentMethod } from "./data";

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
  return (
    <RadioGroup aria-label="Phương thức thanh toán" value={value ?? undefined} onChange={(next) => onChange(next as PaymentMethod)} isDisabled={isDisabled} className="grid grid-cols-2 gap-2 sm:grid-cols-5">
      {methods.map(({ id, icon: Icon }) => <Radio key={id} value={id} className="rounded-lg border border-admin-border px-2 py-3 text-admin-muted data-[selected=true]:border-admin-accent data-[selected=true]:bg-admin-soft data-[selected=true]:text-admin-accent"><Radio.Control className="sr-only"><Radio.Indicator /></Radio.Control><Radio.Content className="flex flex-col items-center gap-1 text-center text-xs"><Icon aria-hidden="true" className="size-5" />{paymentMethodLabels[id]}</Radio.Content></Radio>)}
    </RadioGroup>
  );
}

