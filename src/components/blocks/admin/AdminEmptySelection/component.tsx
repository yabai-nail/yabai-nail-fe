import { Card } from "@heroui/react";

type AdminEmptySelectionProps = {
  readonly title: string;
  readonly description: string;
};

export function AdminEmptySelection({
  title,
  description,
}: AdminEmptySelectionProps) {
  return (
    <Card
      role="status"
      className="rounded-lg border-admin-border bg-admin-surface shadow-none"
    >
      <Card.Content className="p-8 text-center">
        <h2 className="font-bold text-admin-ink">{title}</h2>
        <p className="mt-2 text-sm text-admin-muted">{description}</p>
      </Card.Content>
    </Card>
  );
}
