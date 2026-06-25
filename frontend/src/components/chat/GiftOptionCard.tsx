import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

import { cn, formatPrice } from "@/lib/utils";
import type { GiftOption } from "@/types";

interface GiftOptionCardProps {
  option: GiftOption;
  onSelect: (prompt: string) => void;
  className?: string;
}

export function GiftOptionCard({ option, onSelect, className }: GiftOptionCardProps) {
  return (
    <motion.button
      type="button"
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect(option.prompt)}
      className={cn(
        "group relative flex w-36 shrink-0 flex-col overflow-hidden rounded-2xl border border-brand-purple/15 bg-white text-left shadow-sm transition hover:border-brand-purple/35 hover:shadow-lg hover:shadow-brand-purple/10 sm:w-40",
        className,
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-brand-purple-light via-white to-brand-gold/10">
        {option.image_url ? (
          <img
            src={option.image_url}
            alt={option.sample_product ?? option.label}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-brand-purple/25">
            <Sparkles className="h-8 w-8" />
          </div>
        )}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#1e1033]/75 via-[#1e1033]/15 to-transparent" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_90%_10%,rgba(255,193,7,0.35),transparent_45%)]" />

        {option.price?.amount != null && (
          <span className="absolute right-2 top-2 rounded-full bg-white/95 px-2 py-0.5 text-[10px] font-bold text-brand-purple shadow-sm backdrop-blur">
            {formatPrice(option.price.amount, option.price.currency)}
          </span>
        )}
      </div>

      <div className="relative border-t border-brand-purple/10 bg-white px-3 py-2.5">
        <p className="text-xs font-bold text-text-primary">{option.short}</p>
        <p className="mt-0.5 line-clamp-1 text-[10px] text-text-muted">{option.label}</p>
      </div>
    </motion.button>
  );
}

export function GiftOptionsStrip({
  options,
  loading,
  onSelect,
}: {
  options: GiftOption[];
  loading: boolean;
  onSelect: (prompt: string) => void;
}) {
  if (loading) {
    return (
      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-thin">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-[9.5rem] w-36 shrink-0 animate-pulse overflow-hidden rounded-2xl border border-brand-purple/10 bg-brand-purple-light/40 sm:w-40"
          />
        ))}
      </div>
    );
  }

  if (options.length === 0) return null;

  return (
    <div className="space-y-2">
      <p className="text-center text-xs font-semibold uppercase tracking-wider text-brand-purple/70">
        Browse Kapruka gifts
      </p>
      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-thin">
        {options.map((option) => (
          <GiftOptionCard key={option.id} option={option} onSelect={onSelect} />
        ))}
      </div>
    </div>
  );
}
