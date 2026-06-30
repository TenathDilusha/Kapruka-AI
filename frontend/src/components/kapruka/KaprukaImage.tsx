import { useState } from "react";

import { cn } from "@/lib/utils";

interface KaprukaImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  fallbackClassName?: string;
}

export function KaprukaImage({ src, alt, className, fallbackClassName }: KaprukaImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={cn(
          "flex h-full w-full items-center justify-center bg-kapruka-dark text-[10px] font-semibold uppercase tracking-wide text-white/30",
          fallbackClassName,
          className,
        )}
        aria-hidden
      >
        {alt.slice(0, 1)}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      className={cn("block h-full w-full object-cover", className)}
      onError={() => setFailed(true)}
    />
  );
}
