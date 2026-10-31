import Image from "next/image";

type BrandMarkProps = {
  readonly className?: string;
};

/**
 * The YABAI Nail Studio wordmark used across customer and admin surfaces. Its
 * lettering is black, so globals.css swaps in a light-lettered twin under the
 * dark theme (`.brand-mark-light` / `.brand-mark-dark`).
 */
export function BrandMark({ className = "h-10" }: BrandMarkProps) {
  const imageClassName = `w-auto shrink-0 object-contain ${className}`;
  return (
    <>
      <Image
        src="/brand/yabai-mark.png"
        alt=""
        aria-hidden="true"
        width={800}
        height={326}
        className={`brand-mark-light ${imageClassName}`}
      />
      <Image
        src="/brand/yabai-mark-dark.png"
        alt=""
        aria-hidden="true"
        width={800}
        height={326}
        className={`brand-mark-dark ${imageClassName}`}
      />
    </>
  );
}
