import { v4 as uuidv4 } from "uuid";

import type { CartItem } from "../types/index.js";

export interface Session {
  id: string;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  cart: CartItem[];
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

export function clearCart(sessionId: string): void {
  const session = getOrCreateSession(sessionId);
  session.cart = [];
  session.updatedAt = Date.now();
}
