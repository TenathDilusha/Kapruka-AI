import { motion } from "framer-motion";
import { Gift, Sparkles } from "lucide-react";

import { ProductCarousel } from "@/components/products/ProductCard";
import type { GiftBundle, Product } from "@/types";

interface BundleCardProps {
  bundle: GiftBundle;
  onAdd: (product: Product) => void;
}

export function BundleCard({ bundle, onAdd }: BundleCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35 }}
      className="overflow-hidden rounded-2xl border border-brand-purple/15 bg-white shadow-sm"
    >
      {/* Themed header band */}
      <div className="relative bg-gradient-to-r from-[#1b1430] to-[#0e0f17] px-4 py-3.5">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_20%,rgba(255,216,77,0.18),transparent_55%)]" />
        <div className="relative flex items-start gap-3">
          <div className="rounded-xl bg-brand-gold/15 p-2 text-brand-gold ring-1 ring-brand-gold/30">
            <Gift className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-white">{bundle.theme}</h3>
              <Sparkles className="h-3.5 w-3.5 text-brand-gold" />
            </div>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-gold/80">
              {bundle.occasion}
            </p>
          </div>
        </div>
      </div>

      <div className="p-4">
        <p className="text-sm leading-relaxed text-text-primary/80">{bundle.emotional_description}</p>
        {bundle.estimated_budget && (
          <p className="mt-1.5 text-xs font-medium text-text-muted">💰 {bundle.estimated_budget}</p>
        )}

        <div className="mt-3 mb-3 flex flex-wrap gap-1.5">
          {bundle.items.map((item) => (
            <span
              key={item.label}
              className="rounded-full bg-brand-purple-light px-2.5 py-0.5 text-xs font-medium text-brand-purple"
            >
              {item.label}
            </span>
          ))}
        </div>

        {bundle.products && bundle.products.length > 0 && (
          <ProductCarousel products={bundle.products} onAdd={onAdd} />
        )}
      </div>
    </motion.div>
  );
}
