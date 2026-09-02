import Image from "next/image";

type BrandMarkProps = {
  readonly className?: string;
};

/** The shared YABAI nail-brush mark used across customer and admin surfaces. */
export function BrandMark({ className = "size-10" }: BrandMarkProps) {
  return (
    <Image
      src="/brand/yabai-mark.png"
      alt=""
      aria-hidden="true"
      width={96}
      height={96}
      className={`shrink-0 object-contain ${className}`}
    />
  );
}
