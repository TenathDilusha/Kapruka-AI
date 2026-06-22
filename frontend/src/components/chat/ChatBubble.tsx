import { Bot, User } from "lucide-react";

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
    <div className={cn("flex gap-3", isUser ? "flex-row-reverse" : "flex-row")}>
      <div
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
          isUser ? "bg-amber-500 text-stone-950" : "bg-stone-800 text-amber-400",
        )}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>
      <div className={cn("max-w-[85%] space-y-3", isUser ? "items-end" : "items-start")}>
        <div
          className={cn(
            "rounded-2xl px-4 py-3 text-sm leading-relaxed",
            isUser
              ? "bg-amber-500 text-stone-950 rounded-tr-md"
              : "bg-stone-800/90 text-stone-100 rounded-tl-md border border-stone-700/50",
          )}
        >
          <p className="whitespace-pre-wrap">{message.content}</p>
          {message.checkoutUrl && (
            <a
              href={message.checkoutUrl}
              target="_blank"
              rel="noreferrer"
              className="mt-3 inline-flex rounded-xl bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-400"
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
    <div className="flex gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-stone-800 text-amber-400">
        <Bot className="h-4 w-4" />
      </div>
      <div className="rounded-2xl rounded-tl-md border border-stone-700/50 bg-stone-800/90 px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="flex gap-1">
            <span className="h-2 w-2 animate-bounce rounded-full bg-amber-400 [animation-delay:-0.3s]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-amber-400 [animation-delay:-0.15s]" />
            <span className="h-2 w-2 animate-bounce rounded-full bg-amber-400" />
          </span>
          {status && <span className="text-xs text-stone-400">{status}</span>}
        </div>
      </div>
    </div>
  );
}
