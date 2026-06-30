import { Pencil, X } from "lucide-react";
import { useMemo } from "react";

import { BundleCard } from "@/components/products/BundleCard";
import { ProductGrid } from "@/components/products/ProductCard";
import { KaprukaLogoSpinner } from "@/components/mascot/TharuAvatar";
import { Button } from "@/components/ui/button";
import { cn, sanitizeText } from "@/lib/utils";
import type { ChatMessage, Product } from "@/types";

interface ChatBubbleProps {
  message: ChatMessage;
  onAddProduct: (product: Product) => void;
  onViewProduct?: (product: Product) => void;
  canEdit?: boolean;
  isEditing?: boolean;
  editDraft?: string;
  onEditStart?: () => void;
  onEditDraftChange?: (value: string) => void;
  onEditSubmit?: () => void;
  onEditCancel?: () => void;
}

function dedupeProducts(products: Product[]): Product[] {
  const seen = new Set<string>();
  return products.filter((p) => {
    if (!p.id || seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });
}

export function ChatBubble({
  message,
  onAddProduct,
  onViewProduct,
  canEdit,
  isEditing,
  editDraft,
  onEditStart,
  onEditDraftChange,
  onEditSubmit,
  onEditCancel,
}: ChatBubbleProps) {
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
    <div className={cn("group flex w-full", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "space-y-2",
          isUser ? "max-w-[85%]" : "w-full max-w-none",
        )}
      >
        <div>
          <div
            className={cn(
              "rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm",
              isUser
                ? "rounded-tr-md bg-gradient-to-br from-brand-gold to-brand-gold-dark text-text-primary"
                : "rounded-tl-md border border-brand-purple/15 bg-gradient-to-br from-white to-brand-purple-light/30 text-text-primary",
              isEditing && "ring-2 ring-brand-purple/30",
            )}
          >
            {isUser && isEditing ? (
              <textarea
                value={editDraft ?? ""}
                onChange={(e) => onEditDraftChange?.(e.target.value)}
                rows={3}
                autoFocus
                className="w-full resize-none bg-transparent text-sm leading-relaxed text-text-primary focus:outline-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    onEditSubmit?.();
                  }
                  if (e.key === "Escape") onEditCancel?.();
                }}
              />
            ) : (
              <p className="whitespace-pre-wrap">{sanitizeText(message.content)}</p>
            )}
            {!isUser && message.checkoutUrl && (
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

          {isUser && canEdit && !isEditing && (
            <button
              type="button"
              onClick={onEditStart}
              className="mt-1 flex items-center gap-1 rounded-md px-1 py-0.5 text-[11px] font-medium text-white/45 opacity-100 transition hover:text-white/80 sm:opacity-0 sm:group-hover:opacity-100"
            >
              <Pencil className="h-3 w-3" />
              Edit
            </button>
          )}
        </div>

        {isUser && isEditing && (
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onEditCancel}
              className="h-8 gap-1 border-white/25 bg-white/10 text-white hover:bg-white/20"
            >
              <X className="h-3.5 w-3.5" />
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={!editDraft?.trim()}
              onClick={onEditSubmit}
              className="h-8 bg-brand-purple text-white hover:bg-brand-purple-dark"
            >
              Send
            </Button>
          </div>
        )}

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
