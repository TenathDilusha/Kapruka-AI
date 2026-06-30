import { v4 as uuidv4 } from "uuid";

import type { CartItem, ChatMessage, GiftBundle, Product } from "../types/index.js";
import { callPythonAgent } from "./python-agent.js";
import { addToCart, getCart, getCartStats, getGiftMessageDraft, getOrCreateSession, removeFromCart, setGiftMessageDraft, truncateSessionMessages, updateCartQuantity } from "./session-store.js";
import { cartAddMessage, extractGiftMessage, resolveLanguage } from "./localization.js";
import { isDeliveryDateAllowed, validateCartDelivery } from "./delivery-validation.js";

function mapProducts(raw: Array<{
  id: string;
  name: string;
  summary?: string;
  price: { amount: number | null; currency: string };
  image_url?: string | null;
  url?: string;
  in_stock: boolean;
  category?: { name: string };
}>): Product[] {
  return raw.map((p) => ({
    id: p.id,
    name: p.name,
    summary: p.summary,
    price: p.price,
    image_url: p.image_url,
    url: p.url,
    in_stock: p.in_stock,
    category: p.category,
  }));
}

type AgentResultBundles = Array<{
  id: string;
  theme: string;
  occasion: string;
  emotional_description: string;
  items: Array<{ label: string; search_query: string; category?: string }>;
  estimated_budget?: string;
  products?: Array<{
    id: string;
    name: string;
    price: { amount: number | null; currency: string };
    image_url?: string | null;
    url?: string;
    in_stock: boolean;
  }>;
}>;

function formatCartTotal(total: number, currency: string): string {
  if (currency === "LKR") return `LKR ${total.toLocaleString()}`;
  return `${currency} ${total.toLocaleString()}`;
}

function defaultFollowUps(
  agent: Awaited<ReturnType<typeof callPythonAgent>>,
  productCount: number,
  bundleCount: number,
): string[] {
  const fromAgent = (agent.conversation.follow_up_questions ?? []).map((q) => q.trim()).filter(Boolean);
  if (fromAgent.length >= 2) return fromAgent.slice(0, 3);

  const lang = agent.intent?.language ?? "en";
  const extras: string[] = [];

  if (productCount > 0) {
    extras.push(
      lang === "si" ? "වඩා අඩු මිලේ options" : lang === "singlish" ? "Cheaper options pennanna" : "Show cheaper options",
      lang === "si" ? "Cart එකට add කරන්න" : lang === "singlish" ? "Cart ekata add karanna" : "Add one to my cart",
      lang === "si" ? "වෙනත් gift ideas" : lang === "singlish" ? "Wena gift ideas" : "Show different gift ideas",
    );
  } else if (bundleCount > 0) {
    extras.push(
      lang === "si" ? "Budget එක කීයද?" : lang === "singlish" ? "Budget eka mokakda?" : "What's my budget?",
      lang === "si" ? "Gift එක කාටද?" : lang === "singlish" ? "Gift eka kattiyata da?" : "Who is the gift for?",
      lang === "si" ? "Kapruka products පෙන්වන්න" : lang === "singlish" ? "Kapruka products show karanna" : "Search Kapruka products",
    );
  } else {
    extras.push(
      "Birthday gift ideas",
      "Roses and chocolates",
      "Gifts under LKR 5,000",
    );
  }

  return [...fromAgent, ...extras].filter((q, i, arr) => arr.indexOf(q) === i).slice(0, 3);
}

function mapBundles(bundles: AgentResultBundles): GiftBundle[] {
  return bundles.map((b) => ({
    id: b.id,
    theme: b.theme,
    occasion: b.occasion,
    emotional_description: b.emotional_description,
    items: b.items,
    estimated_budget: b.estimated_budget,
    products: b.products ? mapProducts(b.products) : undefined,
  }));
}

export interface OrchestratorResult {
  sessionId: string;
  message: ChatMessage;
  cart: CartItem[];
  statusUpdates: string[];
}

export async function handleChatMessage(
  sessionId: string | undefined,
  userMessage: string,
  action?: {
    type: "add_to_cart" | "remove_from_cart" | "update_cart";
    productId: string;
    name?: string;
    price?: number;
    currency?: string;
    image_url?: string;
    quantity?: number;
  },
  meta?: { languageHint?: "en" | "si" | "singlish"; historyTruncateTo?: number },
): Promise<OrchestratorResult> {
  const session = getOrCreateSession(sessionId);

  if (userMessage && !action) {
    const lang = resolveLanguage(userMessage, meta?.languageHint, session.preferredLanguage);
    session.preferredLanguage = lang;
    const giftMsg = extractGiftMessage(userMessage);
    if (giftMsg) setGiftMessageDraft(session.id, giftMsg);
    if (meta?.historyTruncateTo != null) {
      truncateSessionMessages(session.id, meta.historyTruncateTo);
    }
  }

  if (action?.type === "add_to_cart" && action.name && action.price != null && action.currency) {
    addToCart(session.id, {
      product_id: action.productId,
      name: action.name,
      quantity: 1,
      price: action.price,
      currency: action.currency,
      image_url: action.image_url,
    });
    const cart = getCart(session.id);
    const stats = getCartStats(cart);
    const msg: ChatMessage = {
      id: uuidv4(),
      role: "assistant",
      content: cartAddMessage(session.preferredLanguage, action.name, {
        lineCount: stats.lineCount,
        totalQty: stats.totalQty,
        total: formatCartTotal(stats.total, action.currency),
      }),
      timestamp: Date.now(),
      status: "done",
    };
    session.messages.push({ role: "user", content: `Add ${action.name} to cart` });
    session.messages.push({ role: "assistant", content: msg.content });
    return { sessionId: session.id, message: msg, cart, statusUpdates: [] };
  }

  if (action?.type === "remove_from_cart") {
    const cart = removeFromCart(session.id, action.productId);
    const msg: ChatMessage = {
      id: uuidv4(),
      role: "assistant",
      content: cart.length
        ? "Item removed from your cart."
        : "Your cart is empty. Keep browsing — I can suggest more gifts anytime!",
      timestamp: Date.now(),
      status: "done",
    };
    return { sessionId: session.id, message: msg, cart, statusUpdates: [] };
  }

  if (action?.type === "update_cart" && action.quantity != null) {
    const cart = updateCartQuantity(session.id, action.productId, action.quantity);
    const msg: ChatMessage = {
      id: uuidv4(),
      role: "assistant",
      content: "Cart updated.",
      timestamp: Date.now(),
      status: "done",
    };
    return { sessionId: session.id, message: msg, cart, statusUpdates: [] };
  }

  session.messages.push({ role: "user", content: userMessage });

  const trackMatch = userMessage.match(/\b(?:track|status)\s+(?:order\s+)?#?([A-Za-z0-9-]+)/i);
  if (trackMatch) {
    const { trackOrder } = await import("./kapruka-mcp.js");
    const tracking = await trackOrder(trackMatch[1]);
    const statusText = tracking.status ?? tracking.raw ?? "Order status retrieved.";
    const items = tracking.items?.map((i) => i.name).join(", ");
    let content = `Order **${trackMatch[1]}**: ${statusText}`;
    if (tracking.recipient?.name) content += `\nRecipient: ${tracking.recipient.name}`;
    if (items) content += `\nItems: ${items}`;
    if (tracking.timeline?.length) {
      content += "\n\n" + tracking.timeline.slice(0, 5).map((t) => `• ${t.status}${t.at ? ` (${t.at})` : ""}`).join("\n");
    }
    const msg: ChatMessage = {
      id: uuidv4(),
      role: "assistant",
      content: content.replace(/\*\*/g, ""),
      timestamp: Date.now(),
      status: "done",
    };
    session.messages.push({ role: "assistant", content: msg.content });
    return { sessionId: session.id, message: msg, cart: getCart(session.id), statusUpdates: ["Tracking order via Kapruka MCP..."] };
  }

  const statusUpdates: string[] = ["Routing to Tharu agents..."];

  const cartStats = getCartStats(session.cart);

  const agent = await callPythonAgent({
    message: userMessage,
    session_id: session.id,
    history: session.messages.slice(-10),
    cart_item_count: cartStats.totalQty,
    language_hint: session.preferredLanguage,
  });

  for (const step of agent.agent_trace ?? []) {
    const labels: Record<string, string> = {
      intent: "Understanding your request...",
      gift_designer: "Designing gift bundles...",
      commerce: "Searching Kapruka catalog...",
      conversation: "Composing your reply...",
    };
    if (labels[step]) statusUpdates.push(labels[step]);
  }

  const products = mapProducts(agent.products ?? []);
  const bundles = mapBundles(agent.bundles?.length ? agent.bundles : agent.gift_bundles.bundles);
  const followUpQuestions = defaultFollowUps(agent, products.length, bundles.length);

  const assistantMsg: ChatMessage = {
    id: uuidv4(),
    role: "assistant",
    content: agent.conversation.message,
    products: products.length > 0 ? products : undefined,
    bundles: bundles.length > 0 ? bundles : undefined,
    followUpQuestions,
    timestamp: Date.now(),
    status: "done",
  };

  session.messages.push({ role: "assistant", content: assistantMsg.content });

  return {
    sessionId: session.id,
    message: assistantMsg,
    cart: getCart(session.id),
    statusUpdates,
  };
}

export async function handleCheckout(
  sessionId: string,
  details: {
    recipient: { name: string; phone: string };
    delivery: { address: string; city: string; date: string; instructions?: string };
    sender: { name: string };
    gift_message?: string;
  },
): Promise<OrchestratorResult> {
  const session = getOrCreateSession(sessionId);
  const cart = getCart(sessionId);

  if (cart.length === 0) {
    throw new Error("Cart is empty");
  }

  const dateCheck = isDeliveryDateAllowed(details.delivery.date);
  if (!dateCheck.ok) {
    throw new Error(dateCheck.reason ?? "Invalid delivery date");
  }

  const deliveryCheck = await validateCartDelivery(cart, details.delivery.city, details.delivery.date);
  if (!deliveryCheck.ok) {
    throw new Error(deliveryCheck.message);
  }

  const giftMessage = details.gift_message?.trim() || getGiftMessageDraft(sessionId);
  if (giftMessage) setGiftMessageDraft(sessionId, giftMessage);

  const { createOrder } = await import("./kapruka-mcp.js");
  const order = await createOrder({
    cart: cart.map((c) => ({ product_id: c.product_id, quantity: c.quantity })),
    recipient: details.recipient,
    delivery: { ...details.delivery, location_type: "house" },
    sender: details.sender,
    gift_message: giftMessage || undefined,
    currency: cart[0]?.currency ?? "LKR",
  });

  const itemSummary = getCartStats(cart);
  const giftNote = giftMessage ? " Your gift message is included." : "";
  const lang = session.preferredLanguage;
  let content = `Your order (${itemSummary.totalQty} items) is ready! Tap below to pay — prices locked for 60 minutes.${giftNote}`;
  if (lang === "si") {
    content = `Order එka ready! Items ${itemSummary.totalQty}.${giftMessage ? " Gift message එka included." : ""} Pay කරන්න — prices 60 minutes lock.`;
  } else if (lang === "singlish") {
    content = `Order eka ready machan — ${itemSummary.totalQty} items!${giftMessage ? " Gift message eka included." : ""} Pay karanna — 60 min price lock.`;
  }
  const msg: ChatMessage = {
    id: uuidv4(),
    role: "assistant",
    content,
    checkoutUrl: order.checkout_url,
    orderRef: order.order_ref,
    timestamp: Date.now(),
    status: "done",
  };

  session.messages.push({ role: "assistant", content: msg.content });
  return { sessionId: session.id, message: msg, cart, statusUpdates: ["Checkout link created"] };
}
