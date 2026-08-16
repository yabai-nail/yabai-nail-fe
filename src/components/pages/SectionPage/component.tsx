export type SectionPageProps = {
  readonly eyebrow: string;
  readonly title: string;
  readonly description: string;
};

/** Minimal page surface used while each customer journey is implemented. */
export const _SectionPage = ({
  eyebrow,
  title,
  description,
}: SectionPageProps) => (
  <main className="flex flex-1 items-center px-4 py-16 sm:px-6 lg:px-8">
    <div className="mx-auto w-full max-w-7xl">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent-soft-foreground">
        {eyebrow}
      </p>
      <h1 className="font-display mt-3 max-w-3xl text-5xl font-medium italic leading-tight tracking-tight text-foreground sm:text-6xl">
        {title}
      </h1>
      <p className="mt-5 max-w-2xl text-base leading-7 text-muted sm:text-lg">
        {description}
      </p>
    </div>
  </main>
);

export const meta = { world: "pure", domain: "section-page" } as const;
