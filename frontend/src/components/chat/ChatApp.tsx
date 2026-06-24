import { AnimatePresence, motion } from "framer-motion";
import { Cake, Flower2, Gift, Heart, Send, ShoppingBag, Sparkles, Truck } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";

import { ChatBubble, TypingIndicator } from "@/components/chat/ChatBubble";
import { TharuAvatar } from "@/components/mascot";
import type { TharuState } from "@/components/mascot";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { addToCart, streamMessage } from "@/lib/api";
import { cn, formatPrice } from "@/lib/utils";
import type { CartItem, ChatMessage, Product } from "@/types";

const WELCOME: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Ayubowan! 🌟 I'm Tharu — your Kapruka gift concierge. Tell me the occasion, who it's for, and your budget, and I'll curate the perfect gift from Sri Lanka's largest catalog.",
  timestamp: Date.now(),
  status: "done",
};

const SUGGESTIONS = [
  { icon: Cake, label: "Birthday gift for mom under 5000", short: "Birthday for mom" },
  { icon: Heart, label: "Anniversary roses and chocolates", short: "Anniversary roses" },
  { icon: Gift, label: "Valentine gift mokakda hari?", short: "Valentine ideas" },
  { icon: Flower2, label: "Wedding gift ideas", short: "Wedding gifts" },
];

const TRUST = [
  { icon: ShoppingBag, label: "Live Kapruka catalog" },
  { icon: Truck, label: "Island-wide delivery" },
  { icon: Sparkles, label: "Guest checkout" },
];

export function ChatApp() {
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState<string>();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState<string>();
  const [inputFocused, setInputFocused] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<(() => void) | null>(null);

  const isWelcome = messages.length === 1;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, statusText]);

  const heroState: TharuState = loading ? "thinking" : inputFocused || input.length > 0 ? "typing" : "idle";

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

  const cartTotal = useMemo(
    () => cart.reduce((sum, i) => sum + i.price * i.quantity, 0),
    [cart],
  );
  const cartCount = useMemo(() => cart.reduce((s, i) => s + i.quantity, 0), [cart]);

  return (
    <div className="tharu-backdrop flex h-dvh flex-col text-text-primary">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-white/60 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <div className="leading-tight">
            <h1 className="flex items-center gap-2 text-lg font-bold tracking-tight">
              <span className="bg-gradient-to-r from-brand-purple to-[#9d4bff] bg-clip-text text-transparent">
                Tharu
              </span>
              <span className="hidden rounded-full bg-brand-gold/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[#9a7400] sm:inline">
                Kapruka AI
              </span>
            </h1>
            <p className="text-xs text-text-muted">Your star for finding the perfect gift</p>
          </div>

          <AnimatePresence>
            {cartCount > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: -6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-2 rounded-full border border-brand-purple/15 bg-white px-3 py-1.5 text-sm shadow-sm"
              >
                <span className="relative flex h-7 w-7 items-center justify-center rounded-full bg-brand-purple text-white">
                  <ShoppingBag className="h-3.5 w-3.5" />
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-gold px-1 text-[10px] font-bold text-text-primary">
                    {cartCount}
                  </span>
                </span>
                <span className="font-semibold text-brand-purple">{formatPrice(cartTotal)}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* Conversation */}
      <ScrollArea className="flex-1 px-4">
        <div className="mx-auto max-w-3xl pb-8 pt-6">
          {isWelcome && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="mb-8 flex flex-col items-center text-center"
            >
              <TharuAvatar size={120} state={heroState} interactive />
              <h2 className="mt-5 text-2xl font-bold tracking-tight">
                Find the <span className="text-brand-purple">perfect gift</span>, effortlessly
              </h2>
              <p className="mt-2 max-w-md text-sm text-text-muted">
                Chat with Tharu in English, සිංහල, or Singlish. Tap me — I'm watching! 👀
              </p>

              <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
                {TRUST.map(({ icon: Icon, label }) => (
                  <span key={label} className="flex items-center gap-1.5 text-xs font-medium text-text-muted">
                    <Icon className="h-3.5 w-3.5 text-brand-purple" />
                    {label}
                  </span>
                ))}
              </div>
            </motion.div>
          )}

          <div className="space-y-6">
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                >
                  <ChatBubble message={msg} onAddProduct={handleAddProduct} />
                </motion.div>
              ))}
            </AnimatePresence>
            {loading && <TypingIndicator status={statusText} />}
          </div>
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Composer */}
      <footer className="border-t border-white/60 bg-white/70 backdrop-blur-xl">
        <div className="mx-auto max-w-3xl px-4 py-4">
          {isWelcome && (
            <div className="mb-3 flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map(({ icon: Icon, label, short }) => (
                <motion.button
                  key={label}
                  type="button"
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleSend(label)}
                  className="group flex items-center gap-1.5 rounded-full border border-brand-purple/20 bg-white px-3.5 py-2 text-xs font-medium text-text-primary shadow-sm transition hover:border-brand-purple hover:bg-brand-purple-light"
                >
                  <Icon className="h-3.5 w-3.5 text-brand-purple" />
                  <span className="sm:hidden">{short}</span>
                  <span className="hidden sm:inline">{label}</span>
                </motion.button>
              ))}
            </div>
          )}

          <form
            className={cn(
              "flex items-center gap-2 rounded-2xl border bg-white p-1.5 pl-4 shadow-sm transition",
              inputFocused ? "border-brand-purple ring-4 ring-brand-purple/10" : "border-border",
            )}
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(input);
            }}
          >
            <Gift className="h-5 w-5 shrink-0 text-brand-purple/60" />
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              placeholder="Describe the perfect gift…"
              disabled={loading}
              className="h-9 flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none disabled:opacity-60"
            />
            <Button
              type="submit"
              size="icon"
              variant="secondary"
              disabled={loading || !input.trim()}
              className="h-10 w-10 rounded-xl shadow-md shadow-brand-purple/20"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
          <p className="mt-2 text-center text-[11px] text-text-muted">
            Powered by the live Kapruka MCP · Real products, real checkout
          </p>
        </div>
      </footer>
    </div>
  );
}
