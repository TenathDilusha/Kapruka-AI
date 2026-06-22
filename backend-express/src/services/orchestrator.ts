import { v4 as uuidv4 } from "uuid";

import type { CartItem, ChatMessage, GiftBundle, Product } from "../types/index.js";
import { createOrder, searchProducts } from "./kapruka-mcp.js";
import { callPythonAgent } from "./python-agent.js";
import { addToCart, getCart, getOrCreateSession } from "./session-store.js";

function dedupeProducts(products: Product[]): Product[] {
  const seen = new Set<string>();
  return products.filter((p) => {
    if (seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });
}

async function searchBundleProducts(bundles: GiftBundle[]): Promise<GiftBundle[]> {
  const enriched: GiftBundle[] = [];

  for (const bundle of bundles) {
    const products: Product[] = [];
    for (const item of bundle.items.slice(0, 2)) {
      const results = await searchProducts({
        q: item.search_query,
        category: item.category ?? undefined,
        limit: 3,
      });
      products.push(...results);
    }
    enriched.push({ ...bundle, products: dedupeProducts(products).slice(0, 6) });
  }

  return enriched;
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
  action?: { type: "add_to_cart"; productId: string; name: string; price: number; currency: string; image_url?: string },
): Promise<OrchestratorResult> {
  const session = getOrCreateSession(sessionId);
  const statusUpdates: string[] = [];

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
    return { sessionId: session.id, message: msg, cart, statusUpdates };
  }

  session.messages.push({ role: "user", content: userMessage });
  statusUpdates.push("Understanding your request...");

  const agent = await callPythonAgent({
    message: userMessage,
    session_id: session.id,
    history: session.messages.slice(-10),
    cart_item_count: session.cart.length,
  });

  statusUpdates.push("Crafting your gift ideas...");

  let products: Product[] = [];
  let bundles: GiftBundle[] = agent.gift_bundles.bundles.map((b) => ({
    id: b.id,
    theme: b.theme,
    occasion: b.occasion,
    emotional_description: b.emotional_description,
    items: b.items,
    estimated_budget: b.estimated_budget,
  }));

  if (agent.needs_mcp_search && agent.product_strategy.searches.length > 0) {
    statusUpdates.push("Searching Kapruka catalog...");
    for (const search of agent.product_strategy.searches.slice(0, 3)) {
      const results = await searchProducts({
        q: search.query,
        category: search.category,
        max_price: search.max_price,
        limit: 5,
      });
      products.push(...results);
    }
    products = dedupeProducts(products).slice(0, 12);
  }

  if (bundles.length > 0) {
    statusUpdates.push("Building gift bundles...");
    bundles = await searchBundleProducts(bundles);
  }

  let checkoutUrl: string | undefined;
  let orderRef: string | undefined;
  let content = agent.conversation.message;

  if (agent.needs_checkout && session.cart.length > 0) {
    statusUpdates.push("Preparing checkout...");
    // Demo checkout requires full delivery details — guide user if missing
    content +=
      "\n\nTo complete checkout, please share: recipient name & phone, delivery address & city, delivery date (YYYY-MM-DD), and your name as sender.";
  }

  if (agent.conversation.follow_up_questions.length > 0 && products.length === 0) {
    content += "\n\n" + agent.conversation.follow_up_questions.slice(0, 2).map((q) => `• ${q}`).join("\n");
  }

  const assistantMsg: ChatMessage = {
    id: uuidv4(),
    role: "assistant",
    content,
    products: products.length > 0 ? products : undefined,
    bundles: bundles.length > 0 ? bundles : undefined,
    checkoutUrl,
    orderRef,
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
