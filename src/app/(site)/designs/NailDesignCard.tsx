import { formatMoney } from "@/lib/admin-format";
import { toNailDesignCard, type NailDesign } from "@/service";

export function NailDesignCard({ design }: Readonly<{ design: NailDesign }>) {
  const card = toNailDesignCard(design);

  return (
    <li className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm transition hover:border-accent">
      <div className="relative aspect-square w-full overflow-hidden bg-accent-soft">
        {card.imageUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img alt={card.name} className="size-full object-cover" src={card.imageUrl} />
        ) : (
          <div className="grid size-full place-items-center text-xs text-accent-soft-foreground">
            YABAI
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 bg-gradient-to-t from-black/75 via-black/35 to-transparent px-3 pb-3 pt-10 text-white">
          <p className="min-w-0 truncate text-sm font-semibold">{card.name}</p>
          {card.indicativePrice !== null ? (
            <span className="shrink-0 rounded-full bg-black/65 px-2.5 py-1 text-xs font-semibold">
              {formatMoney(card.indicativePrice)}
            </span>
          ) : null}
        </div>
      </div>
    </li>
  );
}

