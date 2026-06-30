import { motion } from "framer-motion";
import { Check, ExternalLink, Gift, Search, ShoppingCart, Sparkles } from "lucide-react";
import { useState } from "react";

import { KaprukaImage } from "@/components/kapruka/KaprukaImage";
import { cn, formatPrice, productKaprukaUrl, sanitizeText } from "@/lib/utils";
import type { BundleItem, GiftBundle, Product } from "@/types";

interface BundleCardProps {
  bundle: GiftBundle;
  onAdd: (product: Product) => void;
  onViewProduct?: (product: Product) => void;
  onFindItem?: (query: string) => void;
}

function itemProducts(item: BundleItem): Product[] {
  if (item.products?.length) return item.products;
  if (item.product?.id) return [item.product];
  return [];
}

function BundlePickCard({
  product,
  onAdd,
  onViewProduct,
}: {
  product: Product;
  onAdd: (product: Product) => void;
  onViewProduct?: (product: Product) => void;
}) {
  const [added, setAdded] = useState(false);
  const name = sanitizeText(product.name);
  const kaprukaUrl = productKaprukaUrl(product);

  const handleAdd = () => {
    onAdd({ ...product, name });
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="flex w-[8.75rem] shrink-0 flex-col overflow-hidden rounded-xl border border-border bg-surface sm:w-[9.5rem]"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-kapruka-dark">
        <KaprukaImage src={product.image_url} alt={name} />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <p className="absolute bottom-1 left-1 right-1 line-clamp-1 text-[9px] font-bold text-white drop-shadow">
          {formatPrice(product.price.amount, product.price.currency)}
        </p>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-2">
        <p className="line-clamp-2 min-h-[2rem] text-[10px] font-semibold leading-snug text-white">
          {name}
        </p>
        <div className="mt-auto flex gap-1">
          <button
            type="button"
            onClick={() => (onViewProduct ? onViewProduct(product) : window.open(kaprukaUrl, "_blank"))}
            className="inline-flex flex-1 items-center justify-center rounded-lg border border-white/10 bg-white/5 p-1.5 text-white transition hover:bg-white/10"
            aria-label={`View ${name} on Kapruka`}
          >
            <ExternalLink className="h-3 w-3" />
          </button>
          <button
            type="button"
            onClick={handleAdd}
            disabled={!product.in_stock}
            className={cn(
              "inline-flex flex-1 items-center justify-center rounded-lg p-1.5 transition disabled:opacity-50",
              added ? "bg-emerald-500 text-white" : "bg-brand-gold text-black hover:bg-brand-gold-dark",
            )}
            aria-label={`Add ${name} to cart`}
          >
            {added ? <Check className="h-3 w-3" /> : <ShoppingCart className="h-3 w-3" />}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function BundleItemRow({
  item,
  onAdd,
  onViewProduct,
  onFindItem,
}: {
  item: BundleItem;
  onAdd: (product: Product) => void;
  onViewProduct?: (product: Product) => void;
  onFindItem?: (query: string) => void;
}) {
  const options = itemProducts(item);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-gold/90">
          {item.label}
        </p>
        {options.length > 0 && (
          <span className="text-[10px] font-medium text-text-muted">
            {options.length} options
          </span>
        )}
      </div>

      {options.length > 0 ? (
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-thin">
          {options.map((product) => (
            <BundlePickCard
              key={product.id}
              product={product}
              onAdd={onAdd}
              onViewProduct={onViewProduct}
            />
          ))}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => onFindItem?.(`Find me ${item.label.toLowerCase()} options on Kapruka`)}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 bg-white/5 px-3 py-2.5 text-left transition hover:border-brand-gold/40 hover:bg-white/10"
        >
          <Search className="h-4 w-4 shrink-0 text-brand-gold" />
          <span className="text-xs font-medium text-text-muted">Tap to find {item.label.toLowerCase()} options</span>
        </button>
      )}
    </div>
  );
}

export function BundleCard({ bundle, onAdd, onViewProduct, onFindItem }: BundleCardProps) {
  const itemSlots = bundle.items.length > 0 ? bundle.items : [];

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

        {itemSlots.length > 0 && (
          <div className="space-y-4 border-t border-border pt-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
              Pick from Kapruka
            </p>
            {itemSlots.map((item) => (
              <BundleItemRow
                key={`${item.label}-${item.search_query}`}
                item={item}
                onAdd={onAdd}
                onViewProduct={onViewProduct}
                onFindItem={onFindItem}
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
