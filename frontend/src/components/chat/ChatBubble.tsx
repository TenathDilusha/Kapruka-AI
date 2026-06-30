import { useMemo } from "react";

import { BundleCard } from "@/components/products/BundleCard";
import { ProductGrid } from "@/components/products/ProductCard";
import { KaprukaLogoSpinner } from "@/components/mascot/TharuAvatar";
import { cn, sanitizeText } from "@/lib/utils";
import type { ChatMessage, Product } from "@/types";

interface ChatBubbleProps {
  message: ChatMessage;
  onAddProduct: (product: Product) => void;
  onViewProduct?: (product: Product) => void;
}

function dedupeProducts(products: Product[]): Product[] {
  const seen = new Set<string>();
  return products.filter((p) => {
    if (!p.id || seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });
}

export function ChatBubble({ message, onAddProduct, onViewProduct }: ChatBubbleProps) {
  const isUser = message.role === "user";

  const allProducts = useMemo(() => {
    const fromBundles = message.bundles?.flatMap((b) => b.products ?? []) ?? [];
    return dedupeProducts([...(message.products ?? []), ...fromBundles]);
  }, [message.bundles, message.products]);

  const bundleProductIds = useMemo(
    () => new Set(message.bundles?.flatMap((b) => (b.products ?? []).map((p) => p.id)) ?? []),
    [message.bundles],
  );

  const extraProducts = useMemo(
    () => allProducts.filter((p) => !bundleProductIds.has(p.id)),
    [allProducts, bundleProductIds],
  );

  return (
    <div className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "space-y-4",
          isUser ? "max-w-[85%]" : "w-full max-w-none",
        )}
      >
        <div
          className={cn(
            "rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm",
            isUser
              ? "rounded-tr-md bg-gradient-to-br from-brand-gold to-brand-gold-dark text-text-primary"
              : "rounded-tl-md border border-brand-purple/15 bg-gradient-to-br from-white to-brand-purple-light/30 text-text-primary",
          )}
        >
          <p className="whitespace-pre-wrap">{sanitizeText(message.content)}</p>
          {message.checkoutUrl && (
            <a
              href={message.checkoutUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex rounded-xl bg-brand-purple px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-brand-purple/25 hover:bg-brand-purple-dark"
            >
              Pay securely on Kapruka →
            </a>
          )}
        </div>

        {!isUser && message.bundles && message.bundles.length > 0 && (
          <div className="space-y-4">
            {message.bundles.map((b) => (
              <BundleCard key={b.id} bundle={b} onAdd={onAddProduct} onViewProduct={onViewProduct} />
            ))}
          </div>
        )}

        {!isUser && extraProducts.length > 0 && (
          <ProductGrid
            products={extraProducts}
            onAdd={onAddProduct}
            onViewDetails={onViewProduct}
            title="More Kapruka gifts for you"
          />
        )}

        {!isUser && !message.bundles?.length && allProducts.length > 0 && (
          <ProductGrid products={allProducts} onAdd={onAddProduct} onViewDetails={onViewProduct} />
        )}
      </div>
    </div>
  );
}

export function TypingIndicator({ status }: { status?: string }) {
  return (
    <div className="flex justify-start" role="status" aria-live="polite">
      <div className="flex items-center gap-3 rounded-2xl rounded-tl-md border border-brand-purple/15 bg-gradient-to-br from-white to-brand-purple-light/40 px-4 py-3 shadow-sm">
        <KaprukaLogoSpinner size={36} />
        <span className="text-xs font-medium text-brand-purple/70">{status ?? "Thinking…"}</span>
      </div>
    </div>
  );
}
