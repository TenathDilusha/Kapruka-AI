const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

import type { ChatMessage, ChatResponse, CartItem } from "../types";

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
      action: { type: "add_to_cart", ...product },
    }),
  });
  if (!res.ok) throw new Error("Failed to add to cart");
  return res.json();
}

export function streamMessage(
  message: string,
  sessionId: string | undefined,
  onStatus: (text: string) => void,
  onResult: (data: ChatResponse) => void,
  onError: (err: string) => void,
) {
  const controller = new AbortController();

  fetch(`${API_URL}/api/chat/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, message }),
    signal: controller.signal,
  }).then(async (res) => {
    if (!res.ok || !res.body) {
      onError("Stream failed");
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split("\n\n");
      buffer = parts.pop() ?? "";

      for (const part of parts) {
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
  }).catch(() => onError("Connection lost"));

  return () => controller.abort();
}

export type { ChatMessage, ChatResponse, CartItem };
