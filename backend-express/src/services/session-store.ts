import { v4 as uuidv4 } from "uuid";

import type { CartItem } from "../types/index.js";

export interface Session {
  id: string;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  cart: CartItem[];
  preferredLanguage: "en" | "si" | "singlish";
  giftMessageDraft: string;
  createdAt: number;
  updatedAt: number;
}

const sessions = new Map<string, Session>();

export function getOrCreateSession(sessionId?: string): Session {
  if (sessionId && sessions.has(sessionId)) {
    const s = sessions.get(sessionId)!;
    s.updatedAt = Date.now();
    return s;
  }

  const id = sessionId ?? uuidv4();
  const session: Session = {
    id,
    messages: [],
    cart: [],
    preferredLanguage: "en",
    giftMessageDraft: "",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  sessions.set(id, session);
  return session;
}

export function addToCart(sessionId: string, item: CartItem): CartItem[] {
  const session = getOrCreateSession(sessionId);
  const existing = session.cart.find((c) => c.product_id === item.product_id);
  if (existing) {
    existing.quantity += item.quantity;
  } else {
    session.cart.push(item);
  }
  session.updatedAt = Date.now();
  return session.cart;
}

export function getCart(sessionId: string): CartItem[] {
  return getOrCreateSession(sessionId).cart;
}

export function removeFromCart(sessionId: string, productId: string): CartItem[] {
  const session = getOrCreateSession(sessionId);
  session.cart = session.cart.filter((c) => c.product_id !== productId);
  session.updatedAt = Date.now();
  return session.cart;
}

export function updateCartQuantity(sessionId: string, productId: string, quantity: number): CartItem[] {
  const session = getOrCreateSession(sessionId);
  const item = session.cart.find((c) => c.product_id === productId);
  if (!item) return session.cart;
  if (quantity <= 0) {
    return removeFromCart(sessionId, productId);
  }
  item.quantity = quantity;
  session.updatedAt = Date.now();
  return session.cart;
}

export function getCartStats(cart: CartItem[]): { lineCount: number; totalQty: number; total: number } {
  return {
    lineCount: cart.length,
    totalQty: cart.reduce((s, i) => s + i.quantity, 0),
    total: cart.reduce((s, i) => s + i.price * i.quantity, 0),
  };
}

export function setPreferredLanguage(sessionId: string, language: Session["preferredLanguage"]): void {
  const session = getOrCreateSession(sessionId);
  session.preferredLanguage = language;
  session.updatedAt = Date.now();
}

export function setGiftMessageDraft(sessionId: string, message: string): void {
  const session = getOrCreateSession(sessionId);
  session.giftMessageDraft = message;
  session.updatedAt = Date.now();
}

export function getGiftMessageDraft(sessionId: string): string {
  return getOrCreateSession(sessionId).giftMessageDraft;
}
