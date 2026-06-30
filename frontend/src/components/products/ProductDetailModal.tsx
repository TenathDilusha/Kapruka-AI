import { AnimatePresence, motion } from "framer-motion";
import { ExternalLink, ShoppingCart, Sparkles, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { fetchProductDetails } from "@/lib/kapruka";
import { formatPrice, productKaprukaUrl, sanitizeText } from "@/lib/utils";
import type { Product } from "@/types";
import { useEffect, useState } from "react";

interface ProductDetailModalProps {
  product: Product | null;
  open: boolean;
  onClose: () => void;
  onAdd: (product: Product) => void;
}

export function ProductDetailModal({ product, open, onClose, onAdd }: ProductDetailModalProps) {
  const [details, setDetails] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !product) {
      setDetails(null);
      return;
    }
    setLoading(true);
    fetchProductDetails(product.id)
      .then((d) => setDetails(d ?? product))
      .catch(() => setDetails(product))
      .finally(() => setLoading(false));
  }, [open, product]);

  const p = details ?? product;
  if (!p) return null;

  const name = sanitizeText(p.name);
  const kaprukaUrl = productKaprukaUrl(p);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            aria-label="Close product details"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-kapruka/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            className="fixed inset-x-4 top-[6%] z-50 mx-auto max-h-[88vh] max-w-lg overflow-y-auto rounded-2xl border border-brand-purple/15 bg-white shadow-2xl"
          >
            <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-brand-purple-light to-white">
              {p.image_url ? (
                <img src={p.image_url} alt={name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-brand-purple/30">
                  <Sparkles className="h-12 w-12" />
                </div>
              )}
              <button
                type="button"
                onClick={onClose}
                className="absolute right-3 top-3 rounded-full bg-white/90 p-2 text-brand-purple shadow"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-4 p-5">
              {loading && <p className="text-xs text-text-muted">Loading from Kapruka MCP…</p>}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-brand-purple/70">
                  {p.category?.name ?? "Kapruka product"}
                  {p.stock_level ? ` · ${p.stock_level} stock` : ""}
                </p>
                <h2 className="mt-1 text-lg font-bold text-brand-purple">{name}</h2>
                <p className="mt-2 text-xl font-bold text-brand-purple">
                  {formatPrice(p.price.amount, p.price.currency)}
                </p>
              </div>

              {(p.description || p.summary) && (
                <p className="text-sm leading-relaxed text-text-muted">
                  {sanitizeText(p.description ?? p.summary ?? "")}
                </p>
              )}

              {p.variants && p.variants.length > 1 && (
                <div className="rounded-xl border border-brand-purple/10 bg-brand-purple-light/30 p-3">
                  <p className="mb-2 text-xs font-semibold uppercase text-brand-purple">Variants</p>
                  <ul className="space-y-1 text-sm text-brand-purple">
                    {p.variants.map((v) => (
                      <li key={v.id}>
                        {v.name} — {formatPrice(v.price.amount, v.price.currency)}
                        {!v.in_stock && " (out of stock)"}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex flex-col gap-2 sm:flex-row">
                <Button variant="outline" className="flex-1" asChild>
                  <a href={kaprukaUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                    View on Kapruka
                  </a>
                </Button>
                <Button
                  variant="secondary"
                  className="flex-1 whitespace-nowrap"
                  disabled={!p.in_stock}
                  onClick={() => {
                    onAdd(p);
                    onClose();
                  }}
                >
                  <ShoppingCart className="h-4 w-4 shrink-0" />
                  Add to cart
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
