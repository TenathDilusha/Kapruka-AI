import { BundleCard } from "@/components/products/BundleCard";
import { ProductCarousel } from "@/components/products/ProductCard";
import { cn } from "@/lib/utils";
import type { ChatMessage, Product } from "@/types";

interface ChatBubbleProps {
  message: ChatMessage;
  onAddProduct: (product: Product) => void;
}

export function ChatBubble({ message, onAddProduct }: ChatBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div className={cn("max-w-[85%] space-y-3", isUser ? "items-end" : "items-start")}>
        <div
          className={cn(
            "rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm",
            isUser
              ? "rounded-tr-md bg-gradient-to-br from-brand-gold to-brand-gold-dark text-text-primary"
              : "rounded-tl-md border border-brand-purple/10 bg-white text-text-primary",
          )}
        >
          <p className="whitespace-pre-wrap">{message.content}</p>
          {message.checkoutUrl && (
            <a
              href={message.checkoutUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex rounded-xl bg-brand-purple px-4 py-2 text-sm font-semibold text-white hover:bg-[#520dc2]"
            >
              Pay on Kapruka →
            </a>
          )}
        </div>

        {!isUser && message.bundles && message.bundles.length > 0 && (
          <div className="space-y-3">
            {message.bundles.map((b) => (
              <BundleCard key={b.id} bundle={b} onAdd={onAddProduct} />
            ))}
          </div>
        )}

        {!isUser && message.products && message.products.length > 0 && (
          <ProductCarousel products={message.products} onAdd={onAddProduct} />
        )}
      </div>
    </div>
  );
}

export function TypingIndicator({ status }: { status?: string }) {
  return (
    <div className="flex justify-start">
      <div className="rounded-2xl rounded-tl-md border border-brand-purple/10 bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="flex gap-1">
            <span className="h-2 w-2 animate-bounce rounded-full bg-brand-purple [animation-delay:-0.3s]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-brand-purple [animation-delay:-0.15s]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-brand-purple" />
          </span>
          {status && <span className="text-xs font-medium text-text-muted">{status}</span>}
        </div>
      </div>
    </div>
  );
}
