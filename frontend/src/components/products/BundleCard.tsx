import { Gift } from "lucide-react";

import { ProductCarousel } from "@/components/products/ProductCard";
import type { GiftBundle, Product } from "@/types";

interface BundleCardProps {
  bundle: GiftBundle;
  onAdd: (product: Product) => void;
}

export function BundleCard({ bundle, onAdd }: BundleCardProps) {
  return (
    <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-stone-900/80 p-4">
      <div className="mb-3 flex items-start gap-3">
        <div className="rounded-xl bg-amber-500/20 p-2 text-amber-400">
          <Gift className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-semibold text-amber-100">{bundle.theme}</h3>
          <p className="text-xs uppercase tracking-wide text-amber-500/80">{bundle.occasion}</p>
          <p className="mt-1 text-sm text-stone-300">{bundle.emotional_description}</p>
          {bundle.estimated_budget && (
            <p className="mt-1 text-xs text-stone-500">Budget: {bundle.estimated_budget}</p>
          )}
        </div>
      </div>
      <div className="mb-2 flex flex-wrap gap-1.5">
        {bundle.items.map((item) => (
          <span key={item.label} className="rounded-full bg-stone-800 px-2.5 py-0.5 text-xs text-stone-400">
            {item.label}
          </span>
        ))}
      </div>
      {bundle.products && bundle.products.length > 0 && (
        <ProductCarousel products={bundle.products} onAdd={onAdd} />
      )}
    </div>
  );
}
