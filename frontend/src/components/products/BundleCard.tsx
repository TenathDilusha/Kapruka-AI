import { motion } from "framer-motion";
import { Gift, Sparkles } from "lucide-react";

import { ProductCarousel } from "@/components/products/ProductCard";
import type { GiftBundle, Product } from "@/types";

interface BundleCardProps {
  bundle: GiftBundle;
  onAdd: (product: Product) => void;
  onViewProduct?: (product: Product) => void;
}

export function BundleCard({ bundle, onAdd, onViewProduct }: BundleCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35 }}
      className="overflow-hidden rounded-2xl border border-border bg-surface"
    >
      <div className="relative border-b border-border bg-kapruka px-4 py-3.5">
        <div className="relative flex items-start gap-3">
          <div className="rounded-xl bg-white/10 p-2 text-brand-gold ring-1 ring-white/15">
            <Gift className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-white">{bundle.theme}</h3>
              <Sparkles className="h-3.5 w-3.5 text-brand-gold" />
            </div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-gold">
              {bundle.occasion}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4 bg-canvas p-4">
        <p className="text-sm leading-relaxed text-white/85">{bundle.emotional_description}</p>
        {bundle.estimated_budget && (
          <p className="inline-flex rounded-full bg-brand-gold/20 px-3 py-1 text-xs font-semibold text-brand-gold">
            {bundle.estimated_budget}
          </p>
        )}

        <div className="flex flex-wrap gap-1.5">
          {bundle.items.map((item) => (
            <span
              key={item.label}
              className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs font-medium text-white/80"
            >
              {item.label}
            </span>
          ))}
        </div>

        {bundle.products && bundle.products.length > 0 && (
          <div className="space-y-2 border-t border-border pt-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
              Curated products
            </p>
            <ProductCarousel products={bundle.products} onAdd={onAdd} onViewDetails={onViewProduct} />
          </div>
        )}
      </div>
    </motion.div>
  );
}
