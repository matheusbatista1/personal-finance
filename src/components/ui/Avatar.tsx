/* eslint-disable @next/next/no-img-element */
import { cn } from "@/lib/utils";

interface AvatarProps {
  src?: string | null;
  alt: string;
  initial: string;
  size?: number;
  className?: string;
}

export function Avatar({ src, alt, initial, size = 40, className }: AvatarProps) {
  const baseClass = cn(
    "border-outline-variant/20 bg-surface-container-high text-primary inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border font-mono font-semibold",
    className,
  );
  const style = { width: size, height: size, fontSize: Math.round(size * 0.42) };

  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className={baseClass}
        style={style}
        loading="lazy"
        referrerPolicy="no-referrer"
      />
    );
  }

  return (
    <span aria-label={alt} className={baseClass} style={style}>
      {initial.charAt(0).toUpperCase()}
    </span>
  );
}
