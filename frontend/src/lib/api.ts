const API_URL = (import.meta.env.VITE_API_URL ?? "http://localhost:3001").replace(/\/$/, "");

import type { ChatMessage, ChatResponse, CartItem, GiftOption } from "../types";

export async function fetchGiftOptions(): Promise<GiftOption[]> {
  const res = await fetch(`${API_URL}/api/chat/options`);
  if (!res.ok) throw new Error("Failed to load gift options");
  const data = (await res.json()) as { options: GiftOption[] };
  return data.options ?? [];
}

export async function sendMessage(
  message: string,
  sessionId?: string,
): Promise<ChatResponse> {
  const res = await fetch(`${API_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, message }),
  });
  if (!res.ok) throw new Error("Failed to send message");
  return res.json();
}

export async function addToCart(
  sessionId: string,
  product: { productId: string; name: string; price: number; currency: string; image_url?: string },
): Promise<ChatResponse> {
  const res = await fetch(`${API_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId,
      action: {
        type: "add_to_cart",
        productId: product.productId,
        name: product.name,
        price: product.price,
        currency: product.currency,
        image_url: product.image_url,
      },
    }),
  });
  if (!res.ok) throw new Error("Failed to add to cart");
  return res.json();
}

export async function updateCartItem(
  sessionId: string,
  productId: string,
  quantity: number,
): Promise<ChatResponse> {
  const res = await fetch(`${API_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId,
      action: { type: "update_cart", productId, quantity },
    }),
  });
  if (!res.ok) throw new Error("Failed to update cart");
  return res.json();
}

export async function removeCartItem(sessionId: string, productId: string): Promise<ChatResponse> {
  const res = await fetch(`${API_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId,
      action: { type: "remove_from_cart", productId },
    }),
  });
  if (!res.ok) throw new Error("Failed to remove item");
  return res.json();
}

export async function submitCheckout(
  sessionId: string,
  details: {
    recipient: { name: string; phone: string };
    delivery: { address: string; city: string; date: string; instructions?: string };
    sender: { name: string };
    gift_message?: string;
  },
): Promise<ChatResponse> {
  const res = await fetch(`${API_URL}/api/chat/checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, ...details }),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? "Checkout failed");
  }
  return res.json();
}

export function streamMessage(
  message: string,
  sessionId: string | undefined,
  onStatus: (text: string) => void,
  onResult: (data: ChatResponse) => void,
  onError: (err: string) => void,
  languageHint?: "en" | "si" | "singlish",
  historyTruncateTo?: number,
  onAbort?: () => void,
) {
  const controller = new AbortController();

  fetch(`${API_URL}/api/chat/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, message, languageHint, historyTruncateTo }),
    signal: controller.signal,
  }).then(async (res) => {
    if (controller.signal.aborted) return;
    if (!res.ok || !res.body) {
      onError("Stream failed");
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (controller.signal.aborted) {
        await reader.cancel().catch(() => undefined);
        return;
      }
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split("\n\n");
      buffer = parts.pop() ?? "";

      for (const part of parts) {
        if (controller.signal.aborted) return;
        const lines = part.split("\n");
        let event = "message";
        let data = "";
        for (const line of lines) {
          if (line.startsWith("event: ")) event = line.slice(7);
          if (line.startsWith("data: ")) data = line.slice(6);
        }
        if (!data) continue;
        try {
          const parsed = JSON.parse(data);
          if (event === "status") onStatus(parsed.text);
          if (event === "message") onResult(parsed);
          if (event === "error") onError(parsed.message);
        } catch {
          /* ignore */
        }
      }
    }
  }).catch((err: unknown) => {
    if (controller.signal.aborted || (err instanceof DOMException && err.name === "AbortError")) {
      onAbort?.();
      return;
    }
    onError("Connection lost");
  });

  return () => controller.abort();
}

export type { ChatMessage, ChatResponse, CartItem, GiftOption };
