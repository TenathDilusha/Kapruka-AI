import { AnimatePresence, motion } from "framer-motion";
import { ExternalLink, Gift, Package, Send, ShoppingCart, Sparkles, Square, Truck } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";

import { ChatBubble, TypingIndicator } from "@/components/chat/ChatBubble";
import { GiftOptionsStrip } from "@/components/chat/GiftOptionCard";
import { WelcomeSamplePrompts } from "@/components/chat/WelcomeSamplePrompts";
import { CartPanel, CheckoutForm, type CheckoutDetails } from "@/components/cart/CartPanel";
import { OrderTrackerModal } from "@/components/kapruka/OrderTracker";
import { TharuAvatar } from "@/components/mascot";
import type { TharuState } from "@/components/mascot";
import { ProductDetailModal } from "@/components/products/ProductDetailModal";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  addToCart,
  fetchGiftOptions,
  removeCartItem,
  streamMessage,
  submitCheckout,
  updateCartItem,
} from "@/lib/api";
import { UI, detectLanguage, getSamplePrompts } from "@/lib/i18n";
import { cn, formatPrice } from "@/lib/utils";
import type { CartItem, ChatMessage, GiftOption, Product } from "@/types";

const PENDING_QUERY_KEY = "tharu_pending_query";
const CHAT_STARTED_KEY = "tharu_chat_started";

const INITIAL_WELCOME: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content: `${UI.en.welcome}\n\n${UI.en.welcomeSubtitle}`,
  timestamp: Date.now(),
  status: "done",
};

const t = UI.en;

const TRUST_ICONS = [ShoppingCart, Truck, Sparkles] as const;

const headerPillClass =
  "relative inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-2.5 py-1.5 text-xs font-semibold text-white/90 transition hover:border-brand-gold/50 hover:bg-white/20 sm:px-3";

const headerKaprukaClass =
  "inline-flex shrink-0 items-center gap-1.5 rounded-full border border-brand-gold/50 bg-white px-2.5 py-1.5 text-xs font-semibold text-brand-purple shadow-sm transition hover:border-brand-gold hover:bg-brand-gold hover:text-text-primary sm:px-3";

const welcomeReveal = {
  hidden: { opacity: 0, y: 14 },
  show: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay, duration: 0.55, ease: [0.22, 1, 0.36, 1] as const },
  }),
};

export function ChatApp() {
  const location = useLocation();
  const navigate = useNavigate();
  const isWelcome = location.pathname === "/";
  const queryHandled = useRef(false);

  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    isWelcome ? [INITIAL_WELCOME] : [],
  );
  const [giftMessage, setGiftMessage] = useState("");
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState<string>();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState<string>();
  const [inputFocused, setInputFocused] = useState(false);
  const [giftOptions, setGiftOptions] = useState<GiftOption[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [cartOpen, setCartOpen] = useState(false);
  const [trackOpen, setTrackOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<(() => void) | null>(null);
  const generationRef = useRef(0);

  const samplePrompts = useMemo(() => getSamplePrompts(3), []);

  useEffect(() => {
    let cancelled = false;
    fetchGiftOptions()
      .then((options) => {
        if (!cancelled) setGiftOptions(options);
      })
      .catch(() => {
        if (!cancelled) setGiftOptions([]);
      })
      .finally(() => {
        if (!cancelled) setOptionsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isWelcome) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, loading, statusText, isWelcome]);

  const heroState: TharuState = loading ? "thinking" : inputFocused || input.length > 0 ? "typing" : "idle";

  const trustLabels = t.trust;

  const startStream = useCallback(
    (trimmed: string, options?: { historyTruncateTo?: number }) => {
      const generation = ++generationRef.current;
      const languageHint = detectLanguage(trimmed);

      setLoading(true);
      setStatusText("Thinking...");

      abortRef.current?.();
      abortRef.current = streamMessage(
        trimmed,
        sessionId,
        (status) => {
          if (generation !== generationRef.current) return;
          setStatusText(status);
        },
        (data) => {
          if (generation !== generationRef.current) return;
          setSessionId(data.sessionId);
          setCart(data.cart);
          setMessages((m) => [...m, data.message]);
          setLoading(false);
          setStatusText(undefined);
          abortRef.current = null;
        },
        () => {
          if (generation !== generationRef.current) return;
          setLoading(false);
          setStatusText(undefined);
          abortRef.current = null;
        },
        languageHint,
        options?.historyTruncateTo,
        () => {
          if (generation !== generationRef.current) return;
          setLoading(false);
          setStatusText(undefined);
          abortRef.current = null;
        },
      );
    },
    [sessionId],
  );

  const handleStop = useCallback(() => {
    generationRef.current += 1;
    abortRef.current?.();
    abortRef.current = null;
    setLoading(false);
    setStatusText(undefined);
    setEditingId(null);
    setEditDraft("");
  }, []);

  useEffect(() => {
    if (!isWelcome) return;
    sessionStorage.removeItem(PENDING_QUERY_KEY);
    sessionStorage.removeItem(CHAT_STARTED_KEY);
  }, [isWelcome]);

  useEffect(() => {
    if (location.pathname !== "/chat" || queryHandled.current) return;

    const pending = sessionStorage.getItem(PENDING_QUERY_KEY)?.trim();
    if (pending) {
      queryHandled.current = true;
      sessionStorage.removeItem(PENDING_QUERY_KEY);
      sessionStorage.setItem(CHAT_STARTED_KEY, "1");

      const userMsg: ChatMessage = {
        id: uuidv4(),
        role: "user",
        content: pending,
        timestamp: Date.now(),
      };
      setMessages((m) => [...m, userMsg]);
      startStream(pending);
      return;
    }

    if (!sessionStorage.getItem(CHAT_STARTED_KEY)) {
      navigate("/", { replace: true });
    }
  }, [location.pathname, navigate, startStream]);

  const handleSend = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;

      if (isWelcome) {
        sessionStorage.setItem(PENDING_QUERY_KEY, trimmed);
        navigate("/chat");
        return;
      }

      const userMsg: ChatMessage = {
        id: uuidv4(),
        role: "user",
        content: trimmed,
        timestamp: Date.now(),
      };
      setMessages((m) => [...m, userMsg]);
      setInput("");
      sessionStorage.setItem(CHAT_STARTED_KEY, "1");
      startStream(trimmed);
    },
    [isWelcome, loading, navigate, startStream],
  );

  const handleStartEdit = useCallback((message: ChatMessage) => {
    if (loading || message.role !== "user" || message.id === "welcome") return;
    setEditingId(message.id);
    setEditDraft(message.content);
  }, [loading]);

  const handleEditCancel = useCallback(() => {
    setEditingId(null);
    setEditDraft("");
  }, []);

  const handleEditSubmit = useCallback(() => {
    if (!editingId || loading) return;
    const trimmed = editDraft.trim();
    if (!trimmed) return;

    const editIndex = messages.findIndex((m) => m.id === editingId);
    if (editIndex === -1) return;

    const historyTruncateTo = messages
      .slice(0, editIndex)
      .filter((m) => m.id !== "welcome").length;

    setMessages((prev) => {
      const next = prev.slice(0, editIndex + 1);
      next[editIndex] = { ...next[editIndex], content: trimmed, timestamp: Date.now() };
      return next;
    });
    setEditingId(null);
    setEditDraft("");
    startStream(trimmed, { historyTruncateTo });
  }, [editDraft, editingId, loading, messages, startStream]);

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
    setCartOpen(true);
  };

  const handleUpdateQuantity = async (productId: string, quantity: number) => {
    if (!sessionId) return;
    const res = await updateCartItem(sessionId, productId, quantity);
    setCart(res.cart);
  };

  const handleRemoveFromCart = async (productId: string) => {
    if (!sessionId) return;
    const res = await removeCartItem(sessionId, productId);
    setCart(res.cart);
  };

  const handleCheckoutSubmit = async (details: CheckoutDetails) => {
    if (!sessionId) return;
    setCheckoutLoading(true);
    try {
      const res = await submitCheckout(sessionId, details);
      setCart(res.cart);
      setMessages((m) => [...m, res.message]);
      setCheckoutOpen(false);
      setCartOpen(false);
    } catch (err) {
      setMessages((m) => [
        ...m,
        {
          id: uuidv4(),
          role: "assistant",
          content: err instanceof Error ? err.message : "Checkout failed. Please try again.",
          timestamp: Date.now(),
          status: "done",
        },
      ]);
    } finally {
      setCheckoutLoading(false);
    }
  };

  const cartTotal = useMemo(
    () => cart.reduce((sum, i) => sum + i.price * i.quantity, 0),
    [cart],
  );
  const cartCount = useMemo(() => cart.reduce((s, i) => s + i.quantity, 0), [cart]);

  const lastAssistantId = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "assistant" && messages[i].id !== "welcome") return messages[i].id;
    }
    return null;
  }, [messages]);

  return (
    <div
      className={cn(
        "tharu-backdrop flex h-dvh flex-col text-text-primary",
        isWelcome && "overflow-hidden",
      )}
    >
      {/* Header */}
      <motion.header
        className="sticky top-0 z-20 border-b border-white/10 bg-kapruka/90 backdrop-blur-xl"
        initial={isWelcome ? { opacity: 0, y: -10 } : false}
        animate={{ opacity: 1, y: 0 }}
        transition={isWelcome ? { delay: 0.62, duration: 0.5, ease: [0.22, 1, 0.36, 1] } : { duration: 0 }}
      >
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0 leading-tight">
            <h1 className="flex items-center gap-2 text-lg font-bold tracking-tight">
              <span className="bg-gradient-to-r from-brand-gold to-white bg-clip-text text-transparent">
                Tharu
              </span>
              <span className="hidden rounded-full bg-brand-gold/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-brand-gold sm:inline">
                Kapruka AI
              </span>
            </h1>
            <p className="hidden truncate text-xs text-white/70 sm:block">
              Your star for finding the perfect gift
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <button type="button" onClick={() => setTrackOpen(true)} className={headerPillClass}>
              <Package className="h-3.5 w-3.5 shrink-0 text-brand-gold" />
              <span className="hidden whitespace-nowrap sm:inline">Track order</span>
              <span className="whitespace-nowrap sm:hidden">Track</span>
            </button>
            <button type="button" onClick={() => setCartOpen(true)} className={headerPillClass}>
              <span className="relative shrink-0">
                <ShoppingCart className="h-3.5 w-3.5 text-brand-gold" />
                {cartCount > 0 && (
                  <span className="absolute -right-1.5 -top-1.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-brand-gold px-0.5 text-[9px] font-bold leading-none text-text-primary">
                    {cartCount}
                  </span>
                )}
              </span>
              <span className="whitespace-nowrap">
                {cartCount > 0 ? formatPrice(cartTotal) : "Cart"}
              </span>
            </button>
            <a
              href="https://www.kapruka.com/"
              target="_blank"
              rel="noopener noreferrer"
              className={headerKaprukaClass}
            >
              <ExternalLink className="h-3.5 w-3.5 shrink-0" />
              <span className="whitespace-nowrap">Kapruka</span>
            </a>
          </div>
        </div>
      </motion.header>

      {/* Main content */}
      {isWelcome ? (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="relative min-h-0 flex-1 overflow-hidden">
            <TharuAvatar variant="hero" state={heroState} className="absolute inset-0" />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-kapruka via-kapruka/85 to-transparent px-4 pb-3 pt-12 text-center sm:pb-4 sm:pt-16">
              <motion.h2
                className="text-xl font-bold tracking-tight text-white sm:text-2xl"
                initial={isWelcome ? "hidden" : false}
                animate="show"
                custom={0.72}
                variants={welcomeReveal}
              >
                Find the <span className="text-brand-gold">perfect gift</span>, effortlessly
              </motion.h2>
              <motion.p
                className="mx-auto mt-2 max-w-lg text-sm text-white/75"
                initial={isWelcome ? "hidden" : false}
                animate="show"
                custom={0.82}
                variants={welcomeReveal}
              >
                {t.welcomeSubtitle}
              </motion.p>
              <motion.div
                className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-2"
                initial={isWelcome ? "hidden" : false}
                animate="show"
                custom={0.9}
                variants={welcomeReveal}
              >
                {TRUST_ICONS.map((Icon, i) => (
                  <span key={trustLabels[i]} className="flex items-center gap-1.5 text-xs font-medium text-white/70">
                    <Icon className="h-3.5 w-3.5 text-brand-gold" />
                    {trustLabels[i]}
                  </span>
                ))}
              </motion.div>
            </div>
          </div>

          <motion.div
            className="shrink-0 border-t border-white/10 bg-kapruka-dark/50 px-4 py-2.5 backdrop-blur-md sm:py-3"
            initial={isWelcome ? "hidden" : false}
            animate="show"
            custom={1.02}
            variants={welcomeReveal}
          >
            <div className="mx-auto max-w-3xl">
              <GiftOptionsStrip
                options={giftOptions}
                loading={optionsLoading}
                onSelect={handleSend}
              />
            </div>
          </motion.div>
        </div>
      ) : (
        <ScrollArea className="flex-1 px-4">
          <div className="mx-auto max-w-3xl space-y-6 pb-8 pt-6">
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                >
                  <ChatBubble
                    message={msg}
                    onAddProduct={handleAddProduct}
                    onViewProduct={setDetailProduct}
                    canEdit={msg.role === "user" && msg.id !== "welcome" && !loading}
                    isEditing={editingId === msg.id}
                    editDraft={editingId === msg.id ? editDraft : undefined}
                    onEditStart={() => handleStartEdit(msg)}
                    onEditDraftChange={setEditDraft}
                    onEditSubmit={handleEditSubmit}
                    onEditCancel={handleEditCancel}
                    followUps={
                      msg.id === lastAssistantId && !loading ? msg.followUpQuestions : undefined
                    }
                    onFollowUpSelect={handleSend}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
            {loading && <TypingIndicator status={statusText} />}
            <div ref={bottomRef} />
          </div>
        </ScrollArea>
      )}

      {/* Composer */}
      <motion.footer
        className="border-t border-white/10 bg-kapruka/90 backdrop-blur-xl"
        initial={isWelcome ? "hidden" : false}
        animate="show"
        custom={1.14}
        variants={welcomeReveal}
      >
        <div className="mx-auto max-w-3xl px-4 py-4">
          {isWelcome && (
            <WelcomeSamplePrompts
              className="mb-3"
              prompts={samplePrompts}
              onSelect={handleSend}
              disabled={loading}
            />
          )}
          <form
            className={cn(
              "flex items-center gap-2 rounded-2xl border bg-white p-1.5 pl-4 shadow-lg shadow-black/10 transition",
              inputFocused ? "border-brand-gold ring-4 ring-brand-gold/20" : "border-white/20",
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
              placeholder={t.placeholder}
              className="h-9 flex-1 bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none disabled:opacity-60"
            />
            <Button
              type={loading ? "button" : "submit"}
              size="icon"
              variant="secondary"
              disabled={!loading && !input.trim()}
              onClick={loading ? handleStop : undefined}
              className={cn(
                "h-10 w-10 rounded-xl shadow-md",
                loading
                  ? "bg-text-primary text-white shadow-black/20 hover:bg-text-primary/90"
                  : "shadow-brand-purple/20",
              )}
              aria-label={loading ? "Stop generating" : "Send message"}
            >
              {loading ? <Square className="h-3.5 w-3.5 fill-current" /> : <Send className="h-4 w-4" />}
            </Button>
          </form>
        </div>
      </motion.footer>

      <OrderTrackerModal open={trackOpen} onClose={() => setTrackOpen(false)} />

      <CartPanel
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        cart={cart}
        giftMessage={giftMessage}
        onGiftMessageChange={setGiftMessage}
        onUpdateQuantity={handleUpdateQuantity}
        onRemove={handleRemoveFromCart}
        onCheckout={() => {
          setCartOpen(false);
          setCheckoutOpen(true);
        }}
      />

      <CheckoutForm
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        onSubmit={handleCheckoutSubmit}
        loading={checkoutLoading}
        cartTotal={cartTotal}
        currency={cart[0]?.currency}
        cart={cart}
        defaultGiftMessage={giftMessage}
      />

      <ProductDetailModal
        product={detailProduct}
        open={!!detailProduct}
        onClose={() => setDetailProduct(null)}
        onAdd={handleAddProduct}
      />
    </div>
  );
}
