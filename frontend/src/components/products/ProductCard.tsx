import { ShoppingBag, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn, formatPrice } from "@/lib/utils";
import type { Product } from "@/types";

interface ProductCardProps {
  product: Product;
  onAdd: (product: Product) => void;
}

export function ProductCard({ product, onAdd }: ProductCardProps) {
  return (
    <div className="group w-56 shrink-0 overflow-hidden rounded-2xl border border-stone-800 bg-stone-900/60 backdrop-blur transition hover:border-amber-500/40 hover:shadow-lg hover:shadow-amber-500/10">
      <div className="relative aspect-square overflow-hidden bg-stone-800">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="h-full w-full object-cover transition group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-stone-600">
            <Sparkles className="h-10 w-10" />
          </div>
        )}
      </div>
      <div className="space-y-2 p-3">
        <h3 className="line-clamp-2 text-sm font-medium text-stone-100">{product.name}</h3>
        <p className="text-sm font-semibold text-amber-400">
          {formatPrice(product.price.amount, product.price.currency)}
        </p>
        <div className="flex gap-2">
          <Button size="sm" className="flex-1" onClick={() => onAdd(product)}>
            <ShoppingBag className="h-3.5 w-3.5" />
            Add
          </Button>
          {product.url && (
            <Button size="sm" variant="outline" asChild>
              <a href={product.url} target="_blank" rel="noreferrer">
                View
              </a>
            </Button>
          )}
        </div>
      </div>
    </div>
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
