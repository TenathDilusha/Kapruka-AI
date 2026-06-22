import { Send, ShoppingCart, Sparkles } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";

import { ChatBubble, TypingIndicator } from "@/components/chat/ChatBubble";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { addToCart, streamMessage } from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import type { CartItem, ChatMessage, Product } from "@/types";

const WELCOME: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Ayubowan! I'm Tharu — your Kapruka gift concierge. Tell me the occasion, who it's for, and your budget. I'll curate real gifts from Sri Lanka's largest catalog.",
  timestamp: Date.now(),
  status: "done",
};

const SUGGESTIONS = [
  "Birthday gift for mom under 5000",
  "Anniversary roses and chocolates",
  "Valentine gift mokakda hari?",
  "Wedding gift ideas",
];

export function ChatApp() {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState<string>();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState<string>();
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, statusText]);

  const handleSend = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;

      const userMsg: ChatMessage = {
        id: uuidv4(),
        role: "user",
        content: trimmed,
        timestamp: Date.now(),
      };
      setMessages((m) => [...m, userMsg]);
      setInput("");
      setLoading(true);
      setStatusText("Thinking...");

      abortRef.current?.();
      abortRef.current = streamMessage(
        trimmed,
        sessionId,
        (status) => setStatusText(status),
        (data) => {
          setSessionId(data.sessionId);
          setCart(data.cart);
          setMessages((m) => [...m, data.message]);
          setLoading(false);
          setStatusText(undefined);
        },
        () => {
          setLoading(false);
          setStatusText(undefined);
        },
      );
    },
    [loading, sessionId],
  );

  const handleAddProduct = async (product: Product) => {
    if (!sessionId) return;
    const res = await addToCart(sessionId, {
      productId: product.id,
      name: product.name,
      price: product.price.amount ?? 0,
      currency: product.price.currency,
      image_url: product.image_url ?? undefined,
    });
    setCart(res.cart);
    setMessages((m) => [...m, res.message]);
  };

  const cartTotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <div className="flex h-dvh flex-col bg-stone-950 text-stone-100">
      <header className="flex items-center justify-between border-b border-stone-800 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600">
            <Sparkles className="h-5 w-5 text-stone-950" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Tharu</h1>
            <p className="text-xs text-stone-500">Kapruka Gift Concierge · EN · සිං · Singlish</p>
          </div>
        </div>
        {cart.length > 0 && (
          <div className="flex items-center gap-2 rounded-2xl border border-stone-800 bg-stone-900 px-3 py-2 text-sm">
            <ShoppingCart className="h-4 w-4 text-amber-400" />
            <span>{cart.length} items</span>
            <span className="text-amber-400">{formatPrice(cartTotal)}</span>
          </div>
        )}
      </header>

      <ScrollArea className="flex-1 px-4 py-6">
        <div className="mx-auto max-w-3xl space-y-6">
          {messages.map((msg) => (
            <ChatBubble key={msg.id} message={msg} onAddProduct={handleAddProduct} />
          ))}
          {loading && <TypingIndicator status={statusText} />}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {messages.length === 1 && (
        <div className="flex flex-wrap justify-center gap-2 px-4 pb-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => handleSend(s)}
              className="rounded-full border border-stone-700 bg-stone-900 px-3 py-1.5 text-xs text-stone-300 transition hover:border-amber-500/50 hover:text-amber-200"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <footer className="border-t border-stone-800 p-4">
        <form
          className="mx-auto flex max-w-3xl gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(input);
          }}
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe the perfect gift..."
            disabled={loading}
            className="flex-1"
          />
          <Button type="submit" size="icon" disabled={loading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </footer>
    </div>
  );
}
