import { motion } from "framer-motion";

import { KaprukaImage } from "@/components/kapruka/KaprukaImage";
import { KaprukaLogoSpinner } from "@/components/mascot/TharuAvatar";
import { cn, formatPrice, sanitizeText } from "@/lib/utils";
import type { GiftOption } from "@/types";

interface GiftOptionCardProps {
  option: GiftOption;
  onSelect: (prompt: string) => void;
  className?: string;
  layout?: "grid" | "scroll";
}

export function GiftOptionCard({ option, onSelect, className, layout = "grid" }: GiftOptionCardProps) {
  const productName = sanitizeText(option.sample_product ?? "");
  const typeLabel = sanitizeText(option.label);
  const hasProductName = Boolean(productName) && productName.toLowerCase() !== typeLabel.toLowerCase();
  const displayTitle = hasProductName ? productName : typeLabel;
  const imageSrc = option.image_url;

  return (
    <motion.button
      type="button"
      whileHover={{ y: layout === "scroll" ? -2 : -3 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect(option.prompt)}
      className={cn(
        "group flex shrink-0 flex-col overflow-hidden rounded-xl border border-border bg-surface text-left transition hover:border-brand-gold/30",
        layout === "scroll" ? "w-[8.75rem] sm:w-[9.5rem]" : "w-full min-w-0",
        className,
      )}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-kapruka-dark">
        <KaprukaImage
          src={imageSrc}
          alt={displayTitle}
          className="absolute inset-0 h-full w-full transition duration-500 group-hover:scale-105"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
        <span className="absolute left-1.5 bottom-1.5 rounded-full bg-kapruka/90 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-white backdrop-blur">
          {typeLabel}
        </span>
        {option.price?.amount != null && (
          <span className="absolute right-1.5 top-1.5 rounded-full bg-brand-gold px-1.5 py-0.5 text-[9px] font-bold text-black shadow-sm">
            {formatPrice(option.price.amount, option.price.currency)}
          </span>
        )}
      </div>

      <div className="border-t border-border bg-surface px-2 py-1.5">
        <p className="line-clamp-2 min-h-[2rem] text-[10px] font-semibold leading-snug text-white">
          {displayTitle}
        </p>
      </div>
    </motion.button>
  );
}

export function GiftOptionsStrip({
  options,
  loading,
  onSelect,
  suggestions,
}: {
  options: GiftOption[];
  loading: boolean;
  onSelect: (prompt: string) => void;
  suggestions?: Array<{ short: string; prompt: string }>;
}) {
  if (loading) {
    return (
      <div className="flex flex-col items-center gap-2 py-1">
        <p className="text-center text-[11px] font-semibold uppercase tracking-wider text-brand-gold/90">
          Kapruka bestsellers
        </p>
        <KaprukaLogoSpinner size={40} onPurple />
      </div>
    );
  }

  if (options.length === 0) return null;

  const withImages = options.filter((o) => o.image_url);
  const displayOptions = (withImages.length >= 4 ? withImages : options).slice(0, 6);

  return (
    <div className="space-y-2.5">
      <p className="text-center text-[11px] font-semibold uppercase tracking-wider text-brand-gold/90">
        Kapruka bestsellers
      </p>

      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-thin sm:mx-0 sm:grid sm:grid-cols-4 sm:gap-2 sm:overflow-visible sm:px-0 sm:pb-0">
        {displayOptions.slice(0, 4).map((option) => (
          <GiftOptionCard key={option.id} option={option} onSelect={onSelect} layout="scroll" className="sm:w-full" />
        ))}
      </div>

      {suggestions && suggestions.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2">
          {suggestions.map((s) => (
            <button
              key={s.prompt}
              type="button"
              onClick={() => onSelect(s.prompt)}
              className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[11px] font-medium text-white/90 transition hover:border-brand-gold/50 hover:bg-white/20"
            >
              {s.short}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
