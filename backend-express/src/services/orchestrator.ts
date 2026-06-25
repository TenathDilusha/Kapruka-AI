import { v4 as uuidv4 } from "uuid";

import type { CartItem, ChatMessage, GiftBundle, Product } from "../types/index.js";
import { callPythonAgent } from "./python-agent.js";
import { addToCart, getCart, getOrCreateSession } from "./session-store.js";

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

function mapBundles(
  bundles: AgentResultBundles,
): GiftBundle[] {
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

export interface OrchestratorResult {
  sessionId: string;
  message: ChatMessage;
  cart: CartItem[];
  statusUpdates: string[];
}

export async function handleChatMessage(
  sessionId: string | undefined,
  userMessage: string,
  action?: { type: "add_to_cart"; productId: string; name: string; price: number; currency: string; image_url?: string },
): Promise<OrchestratorResult> {
  const session = getOrCreateSession(sessionId);

  if (action?.type === "add_to_cart") {
    addToCart(session.id, {
      product_id: action.productId,
      name: action.name,
      quantity: 1,
      price: action.price,
      currency: action.currency,
      image_url: action.image_url,
    });
    const cart = getCart(session.id);
    const msg: ChatMessage = {
      id: uuidv4(),
      role: "assistant",
      content: `Added **${action.name}** to your cart. You now have ${cart.length} item(s). Say "checkout" when you're ready!`,
      timestamp: Date.now(),
      status: "done",
    };
    session.messages.push({ role: "user", content: `Add ${action.name} to cart` });
    session.messages.push({ role: "assistant", content: msg.content });
    return { sessionId: session.id, message: msg, cart, statusUpdates: [] };
  }

  session.messages.push({ role: "user", content: userMessage });

  const statusUpdates: string[] = ["Routing to Tharu agents..."];

  const agent = await callPythonAgent({
    message: userMessage,
    session_id: session.id,
    history: session.messages.slice(-10),
    cart_item_count: session.cart.length,
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

  const assistantMsg: ChatMessage = {
    id: uuidv4(),
    role: "assistant",
    content: agent.conversation.message,
    products: products.length > 0 ? products : undefined,
    bundles: bundles.length > 0 ? bundles : undefined,
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

  // Checkout still initiated via Express → can move to Python commerce agent later
  const { createOrder } = await import("./kapruka-mcp.js");
  const order = await createOrder({
    cart: cart.map((c) => ({ product_id: c.product_id, quantity: c.quantity })),
    recipient: details.recipient,
    delivery: { ...details.delivery, location_type: "house" },
    sender: details.sender,
    gift_message: details.gift_message,
  });

  const msg: ChatMessage = {
    id: uuidv4(),
    role: "assistant",
    content: `Your order is ready! Tap below to pay — prices are locked for 60 minutes.`,
    checkoutUrl: order.checkout_url,
    orderRef: order.order_ref,
    timestamp: Date.now(),
    status: "done",
  };

  session.messages.push({ role: "assistant", content: msg.content });
  return { sessionId: session.id, message: msg, cart, statusUpdates: ["Checkout link created"] };
}
