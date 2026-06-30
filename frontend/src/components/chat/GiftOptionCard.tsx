import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { cn, formatPrice, sanitizeText } from "@/lib/utils";
import { KaprukaLogoSpinner } from "@/components/mascot/TharuAvatar";
import type { GiftOption } from "@/types";

interface GiftOptionCardProps {
  option: GiftOption;
  onSelect: (prompt: string) => void;
  className?: string;
  layout?: "grid" | "spotlight";
}

export function GiftOptionCard({ option, onSelect, className, layout = "grid" }: GiftOptionCardProps) {
  const productName = sanitizeText(option.sample_product ?? option.short);
  const typeLabel = sanitizeText(option.label);

  if (layout === "spotlight") {
    return (
      <motion.button
        type="button"
        initial={{ opacity: 0, x: 24 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -24 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        onClick={() => onSelect(option.prompt)}
        className={cn(
          "group flex w-full items-stretch overflow-hidden rounded-2xl border border-brand-purple/20 bg-white text-left shadow-md shadow-brand-purple/10 transition hover:border-brand-gold/50 hover:shadow-lg",
          className,
        )}
      >
        <div className="relative aspect-[4/3] w-[38%] min-w-[7rem] max-w-[9.5rem] shrink-0 overflow-hidden bg-gradient-to-br from-brand-purple-light via-white to-brand-gold/10 sm:w-[34%]">
          {option.image_url ? (
            <img
              src={option.image_url}
              alt={productName}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-brand-purple/25">
              <Sparkles className="h-7 w-7" />
            </div>
          )}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#1e1033]/40 to-transparent" />
        </div>

        <div className="flex min-w-0 flex-1 flex-col justify-center px-3 py-2.5 sm:px-4 sm:py-3">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-brand-purple/70">
            {typeLabel}
          </span>
          <p className="mt-0.5 line-clamp-2 text-sm font-bold leading-snug text-text-primary sm:text-base">
            {productName}
          </p>
          {option.price?.amount != null && (
            <p className="mt-1.5 text-xs font-bold text-brand-purple sm:text-sm">
              {formatPrice(option.price.amount, option.price.currency)}
            </p>
          )}
          <span className="mt-2 text-[10px] font-medium text-text-muted group-hover:text-brand-purple">
            Tap to explore →
          </span>
        </div>
      </motion.button>
    );
  }

  return (
    <motion.button
      type="button"
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect(option.prompt)}
      className={cn(
        "group relative flex w-full min-w-0 flex-col overflow-hidden rounded-xl border border-brand-purple/15 bg-white text-left shadow-sm transition hover:border-brand-purple/35 hover:shadow-md hover:shadow-brand-purple/10",
        className,
      )}
    >
      <div className="relative aspect-[5/4] overflow-hidden bg-gradient-to-br from-brand-purple-light via-white to-brand-gold/10">
        {option.image_url ? (
          <img
            src={option.image_url}
            alt={productName}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-brand-purple/25">
            <Sparkles className="h-6 w-6" />
          </div>
        )}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#1e1033]/60 via-transparent to-transparent" />

        {option.price?.amount != null && (
          <span className="absolute right-1.5 top-1.5 rounded-full bg-white/95 px-1.5 py-0.5 text-[9px] font-bold text-brand-purple shadow-sm backdrop-blur">
            {formatPrice(option.price.amount, option.price.currency)}
          </span>
        )}
      </div>

      <div className="relative border-t border-brand-purple/10 bg-white px-2 py-2">
        <p className="line-clamp-1 text-[10px] font-bold leading-tight text-text-primary">{productName}</p>
        <p className="mt-0.5 text-[9px] font-medium text-brand-purple/80">{typeLabel}</p>
      </div>
    </motion.button>
  );
}

function SpotlightCarousel({
  options,
  onSelect,
}: {
  options: GiftOption[];
  onSelect: (prompt: string) => void;
}) {
  const [index, setIndex] = useState(0);
  const count = options.length;

  const go = useCallback(
    (delta: number) => {
      setIndex((i) => (i + delta + count) % count);
    },
    [count],
  );

  useEffect(() => {
    if (count <= 1) return;
    const timer = setInterval(() => go(1), 4500);
    return () => clearInterval(timer);
  }, [count, go]);

  const active = options[index];

  return (
    <div className="relative px-1">
      <div className="overflow-hidden rounded-2xl">
        <AnimatePresence mode="wait">
          <GiftOptionCard
            key={active.id}
            option={active}
            onSelect={onSelect}
            layout="spotlight"
          />
        </AnimatePresence>
      </div>

      {count > 1 && (
        <>
          <button
            type="button"
            aria-label="Previous bestseller"
            onClick={() => go(-1)}
            className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/40 bg-black/25 p-1 text-white shadow-md backdrop-blur transition hover:bg-black/40"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Next bestseller"
            onClick={() => go(1)}
            className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full border border-white/40 bg-black/25 p-1 text-white shadow-md backdrop-blur transition hover:bg-black/40"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          <div className="mt-2.5 flex items-center justify-center gap-1.5">
            {options.map((opt, i) => (
              <button
                key={opt.id}
                type="button"
                aria-label={`Show ${sanitizeText(opt.label)} bestseller`}
                onClick={() => setIndex(i)}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === index ? "w-5 bg-brand-gold" : "w-1.5 bg-white/30 hover:bg-white/50",
                )}
              />
            ))}
          </div>
        </>
      )}
    </div>
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
        <p className="text-center text-xs font-semibold uppercase tracking-wider text-brand-gold/90">
          Kapruka bestsellers
        </p>
        <KaprukaLogoSpinner size={40} onPurple />
      </div>
    );
  }

  if (options.length === 0) return null;

  const gridItems = options.slice(0, 4);

  return (
    <div className="space-y-2.5">
      <p className="text-center text-xs font-semibold uppercase tracking-wider text-brand-gold/90">
        Kapruka bestsellers
      </p>

      {/* Mobile: rotating spotlight — no horizontal scroll */}
      <div className="sm:hidden">
        <SpotlightCarousel options={options} onSelect={onSelect} />
      </div>

      {/* Desktop: compact 4-up grid — everything visible, no scroll */}
      <div className="hidden grid-cols-4 gap-2 sm:grid">
        {gridItems.map((option) => (
          <GiftOptionCard key={option.id} option={option} onSelect={onSelect} layout="grid" />
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
