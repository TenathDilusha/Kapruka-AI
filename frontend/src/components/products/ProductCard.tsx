import { motion } from "framer-motion";
import { Check, ExternalLink, ShoppingCart, Sparkles } from "lucide-react";
import { useState } from "react";

import { cn, formatPrice, productKaprukaUrl, sanitizeText } from "@/lib/utils";
import type { Product } from "@/types";

interface ProductCardProps {
  product: Product;
  onAdd: (product: Product) => void;
  onViewDetails?: (product: Product) => void;
  compact?: boolean;
}

export function ProductCard({ product, onAdd, onViewDetails, compact = false }: ProductCardProps) {
  const [added, setAdded] = useState(false);
  const name = sanitizeText(product.name);
  const summary = product.summary ? sanitizeText(product.summary) : undefined;
  const kaprukaUrl = productKaprukaUrl(product);

  const handleAdd = () => {
    onAdd({ ...product, name });
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ type: "spring", stiffness: 320, damping: 22 }}
      className={cn(
        "group flex flex-col overflow-hidden rounded-2xl border border-brand-purple/15 bg-white shadow-sm transition hover:border-brand-purple/35 hover:shadow-lg hover:shadow-brand-purple/10",
        compact ? "w-full" : "w-full",
      )}
    >
      <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-brand-purple-light via-white to-brand-gold/10">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={name}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-brand-purple/30">
            <Sparkles className="h-10 w-10" />
          </div>
        )}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-brand-purple/25 via-transparent to-transparent" />

        {product.in_stock ? (
          <span className="absolute left-2 top-2 rounded-full bg-brand-purple/90 px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm backdrop-blur">
            In stock
          </span>
        ) : (
          <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-text-muted shadow-sm backdrop-blur">
            Sold out
          </span>
        )}

        {product.category?.name && (
          <span className="absolute right-2 top-2 rounded-full bg-brand-gold/90 px-2 py-0.5 text-[10px] font-semibold text-text-primary shadow-sm">
            {product.category.name}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 border-t border-brand-purple/10 bg-gradient-to-b from-white to-brand-purple-light/30 p-3">
        <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-snug text-brand-purple">
          {name}
        </h3>
        {summary && !compact && (
          <p className="line-clamp-2 text-[11px] leading-relaxed text-text-muted">{summary}</p>
        )}

        <p className="text-base font-bold text-brand-purple">
          {formatPrice(product.price.amount, product.price.currency)}
        </p>

        <div className="mt-auto flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={() => (onViewDetails ? onViewDetails(product) : window.open(kaprukaUrl, "_blank"))}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-brand-purple/25 bg-white px-3 py-2 text-xs font-semibold text-brand-purple transition hover:border-brand-purple hover:bg-brand-purple-light"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            {onViewDetails ? "Details" : "View on Kapruka"}
          </button>
          <button
            type="button"
            onClick={handleAdd}
            disabled={!product.in_stock}
            className={cn(
              "inline-flex shrink-0 items-center justify-center gap-1 rounded-xl px-2.5 py-2 text-[11px] font-semibold whitespace-nowrap transition disabled:cursor-not-allowed disabled:opacity-50 sm:flex-1 sm:gap-1.5 sm:px-3 sm:text-xs",
              added
                ? "bg-emerald-500 text-white"
                : "bg-brand-gold text-text-primary hover:bg-brand-gold-dark",
            )}
          >
            {added ? <Check className="h-3.5 w-3.5 shrink-0" /> : <ShoppingCart className="h-3.5 w-3.5 shrink-0" />}
            {added ? "Added" : "Add to cart"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export function ProductGrid({
  products,
  onAdd,
  onViewDetails,
  title = "Kapruka picks for you",
  className,
}: {
  products: Product[];
  onAdd: (p: Product) => void;
  onViewDetails?: (p: Product) => void;
  title?: string;
  className?: string;
}) {
  if (products.length === 0) return null;

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-sm font-bold text-brand-purple">{title}</h4>
        <span className="rounded-full bg-brand-purple-light px-2.5 py-0.5 text-[10px] font-semibold text-brand-purple">
          {products.length} items
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} onAdd={onAdd} onViewDetails={onViewDetails} />
        ))}
      </div>
    </div>
  );
}

export function ProductCarousel({
  products,
  onAdd,
  onViewDetails,
  className,
}: {
  products: Product[];
  onAdd: (p: Product) => void;
  onViewDetails?: (p: Product) => void;
  className?: string;
}) {
  return (
    <div className={cn("grid grid-cols-2 gap-3 sm:grid-cols-3", className)}>
      {products.map((p) => (
        <ProductCard key={p.id} product={p} onAdd={onAdd} onViewDetails={onViewDetails} compact />
      ))}
    </div>
  );
}
