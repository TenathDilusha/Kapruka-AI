import { motion } from "framer-motion";
import { Check, Plus, Sparkles } from "lucide-react";
import { useState } from "react";

import { cn, formatPrice } from "@/lib/utils";
import type { Product } from "@/types";

interface ProductCardProps {
  product: Product;
  onAdd: (product: Product) => void;
}

export function ProductCard({ product, onAdd }: ProductCardProps) {
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    onAdd(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="group flex w-52 shrink-0 flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-sm transition hover:border-brand-purple/30 hover:shadow-xl hover:shadow-brand-purple/10"
    >
      <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-brand-purple-light to-white">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-brand-purple/30">
            <Sparkles className="h-10 w-10" />
          </div>
        )}

        {product.in_stock ? (
          <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 shadow-sm backdrop-blur">
            In stock
          </span>
        ) : (
          <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-text-muted shadow-sm backdrop-blur">
            Sold out
          </span>
        )}

        {product.url && (
          <a
            href={product.url}
            target="_blank"
            rel="noreferrer"
            className="absolute right-2 top-2 rounded-full bg-white/90 px-2.5 py-0.5 text-[10px] font-semibold text-brand-purple opacity-0 shadow-sm backdrop-blur transition group-hover:opacity-100"
          >
            View
          </a>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-medium leading-snug text-text-primary">
          {product.name}
        </h3>
        <div className="mt-auto flex items-center justify-between gap-2">
          <p className="text-sm font-bold text-brand-purple">
            {formatPrice(product.price.amount, product.price.currency)}
          </p>
          <button
            type="button"
            onClick={handleAdd}
            className={cn(
              "flex h-8 items-center gap-1 rounded-full px-3 text-xs font-semibold transition",
              added
                ? "bg-emerald-500 text-white"
                : "bg-brand-gold text-text-primary hover:bg-brand-gold-dark",
            )}
          >
            {added ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
            {added ? "Added" : "Add"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export function ProductCarousel({
  products,
  onAdd,
  className,
}: {
  products: Product[];
  onAdd: (p: Product) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex gap-3 overflow-x-auto pb-2 scrollbar-thin", className)}>
      {products.map((p) => (
        <ProductCard key={p.id} product={p} onAdd={onAdd} />
      ))}
    </div>
  );
}
