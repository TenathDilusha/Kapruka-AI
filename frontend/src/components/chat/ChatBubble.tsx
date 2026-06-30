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
  followUps?: string[];
  onFollowUpSelect?: (prompt: string) => void;
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
  followUps,
  onFollowUpSelect,
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
              "rounded-2xl px-4 py-3 text-sm leading-relaxed",
              isUser
                ? "rounded-tr-md bg-kapruka text-white"
                : "rounded-tl-md border border-border bg-surface text-text-primary",
              isEditing && "ring-2 ring-kapruka/30",
            )}
          >
            {isUser && isEditing ? (
              <textarea
                value={editDraft ?? ""}
                onChange={(e) => onEditDraftChange?.(e.target.value)}
                rows={3}
                autoFocus
                className="w-full resize-none bg-transparent text-sm leading-relaxed text-white placeholder:text-white/60 focus:outline-none"
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
                className="mt-3 inline-flex rounded-lg bg-kapruka px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-kapruka-dark"
              >
                Pay securely on Kapruka →
              </a>
            )}
          </div>

          {isUser && canEdit && !isEditing && (
            <button
              type="button"
              onClick={onEditStart}
              className="mt-1 flex items-center gap-1 rounded-md px-1 py-0.5 text-[11px] font-medium text-text-muted opacity-100 transition hover:text-white sm:opacity-0 sm:group-hover:opacity-100"
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
              className="h-8 gap-1 border-border bg-surface text-text-primary hover:bg-white/5"
            >
              <X className="h-3.5 w-3.5" />
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={!editDraft?.trim()}
              onClick={onEditSubmit}
              className="h-8 bg-kapruka text-white hover:bg-kapruka-dark"
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

        {!isUser && followUps && followUps.length > 0 && onFollowUpSelect && (
          <div className="flex flex-wrap gap-2 pt-1">
            {followUps.map((question) => (
              <button
                key={question}
                type="button"
                onClick={() => onFollowUpSelect(question)}
                className="rounded-lg border border-border bg-surface px-3 py-1.5 text-left text-xs font-medium leading-snug text-white/90 transition hover:border-brand-gold/40 hover:bg-white/5"
              >
                {question}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function TypingIndicator({ status }: { status?: string }) {
  return (
    <div className="flex justify-start" role="status" aria-live="polite">
      <div className="flex items-center gap-3 rounded-2xl rounded-tl-md border border-border bg-surface px-4 py-3">
        <KaprukaLogoSpinner size={36} />
        <span className="text-xs font-medium text-text-muted">{status ?? "Thinking…"}</span>
      </div>
    </div>
  );
}
