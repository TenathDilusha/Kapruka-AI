const MCP_URL = process.env.KAPRUKA_MCP_URL ?? "https://mcp.kapruka.com/mcp";
const MCP_BASE = MCP_URL.replace(/\/mcp\/?$/, "");

interface McpResult {
  content?: Array<{ type: string; text?: string }>;
  isError?: boolean;
}

function parseMcpBody(text: string): unknown {
  const trimmed = text.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("{")) {
    return JSON.parse(trimmed);
  }

  for (const line of trimmed.split("\n")) {
    if (line.startsWith("data: ")) {
      try {
        const payload = JSON.parse(line.slice(6));
        if (payload.result !== undefined) return payload;
        if (payload.error) throw new Error(payload.error.message ?? "MCP error");
      } catch {
        /* continue */
      }
    }
  }

  throw new Error("Unable to parse MCP response");
}

async function mcpRpc(
  method: string,
  params?: Record<string, unknown>,
  sessionId?: string,
  isNotification = false,
): Promise<{ result: McpResult; sessionId: string }> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json, text/event-stream",
  };
  if (sessionId) headers["Mcp-Session-Id"] = sessionId;

  const body: Record<string, unknown> = { jsonrpc: "2.0", method, params };
  if (!isNotification) body.id = Date.now();

  const res = await fetch(MCP_URL, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(20_000),
  });

  const newSessionId = res.headers.get("mcp-session-id") ?? sessionId ?? "";

  if (isNotification) {
    return { result: { content: [] }, sessionId: newSessionId };
  }

  const text = await res.text();
  const parsed = parseMcpBody(text) as { result?: McpResult; error?: { message: string } };

  if (parsed?.error) {
    throw new Error(parsed.error.message);
  }

  return { result: parsed.result ?? { content: [] }, sessionId: newSessionId };
}

let mcpSessionId: string | undefined;
let sessionInit: Promise<string> | undefined;

function resetMcpSession(): void {
  mcpSessionId = undefined;
  sessionInit = undefined;
}

async function ensureSession(): Promise<string> {
  if (mcpSessionId) return mcpSessionId;
  if (!sessionInit) {
    sessionInit = (async () => {
      const init = await mcpRpc("initialize", {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: { name: "tharu-ai", version: "1.0.0" },
      });
      const sid = init.sessionId;
      await mcpRpc("notifications/initialized", {}, sid, true);
      mcpSessionId = sid;
      return sid;
    })().catch((err) => {
      resetMcpSession();
      throw err;
    });
  }
  return sessionInit;
}

function extractText(result: McpResult): string {
  const block = result.content?.find((c) => c.type === "text");
  return block?.text ?? "";
}

function mcpToolArgs(params: Record<string, unknown>): Record<string, unknown> {
  return { params };
}

function parseToolJson<T>(text: string): T | null {
  if (!text || text.startsWith("Error")) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

async function callKaprukaTool(name: string, params: Record<string, unknown>): Promise<string> {
  const sessionId = await ensureSession();
  const { result } = await mcpRpc(
    "tools/call",
    { name, arguments: mcpToolArgs(params) },
    sessionId,
  );
  return extractText(result);
}

export interface KaprukaProduct {
  id: string;
  name: string;
  summary?: string;
  description?: string;
  price: { amount: number | null; currency: string };
  image_url?: string | null;
  in_stock: boolean;
  url?: string;
  category?: { name: string; slug?: string };
  variants?: Array<{ id: string; name: string; price: { amount: number | null; currency: string }; in_stock: boolean }>;
  stock_level?: string;
}

export interface KaprukaCategory {
  name: string;
  url?: string;
}

export interface DeliveryCity {
  name: string;
  aliases?: string[];
}

export interface DeliveryCheckResult {
  city: string;
  checked_date: string;
  available: boolean;
  rate?: number;
  currency?: string;
  perishable_warning?: string;
  reason?: string;
}

export interface TrackOrderResult {
  order_number?: string;
  status?: string;
  recipient?: { name?: string; phone?: string };
  items?: Array<{ name: string; quantity?: number }>;
  timeline?: Array<{ status: string; at?: string }>;
  raw?: string;
}

export async function getMcpHealth(): Promise<{ status: string }> {
  const res = await fetch(`${MCP_BASE}/health`, { signal: AbortSignal.timeout(8_000) });
  if (!res.ok) throw new Error("MCP health check failed");
  return res.json() as Promise<{ status: string }>;
}

export async function getMcpStats(): Promise<{ cache?: { size: number; max: number; hits: number; misses: number } }> {
  const res = await fetch(`${MCP_BASE}/stats`, { signal: AbortSignal.timeout(8_000) });
  if (!res.ok) throw new Error("MCP stats unavailable");
  return res.json();
}

export async function searchProducts(args: {
  q: string;
  category?: string;
  min_price?: number;
  max_price?: number;
  in_stock_only?: boolean;
  sort?: string;
  limit?: number;
  cursor?: string;
  currency?: string;
}): Promise<{ results: KaprukaProduct[]; next_cursor?: string | null }> {
  const searchParams: Record<string, unknown> = {
    q: args.q,
    limit: args.limit ?? 6,
    in_stock_only: args.in_stock_only ?? true,
    response_format: "json",
  };
  if (args.category) searchParams.category = args.category;
  if (args.min_price !== undefined) searchParams.min_price = args.min_price;
  if (args.max_price !== undefined) searchParams.max_price = args.max_price;
  if (args.sort) searchParams.sort = args.sort;
  if (args.cursor) searchParams.cursor = args.cursor;
  if (args.currency) searchParams.currency = args.currency;

  try {
    const text = await callKaprukaTool("kapruka_search_products", searchParams);
    const data = parseToolJson<{ results: KaprukaProduct[]; next_cursor?: string | null }>(text);
    return { results: data?.results ?? [], next_cursor: data?.next_cursor ?? null };
  } catch {
    resetMcpSession();
    return { results: [], next_cursor: null };
  }
}

export async function getProduct(productId: string, currency = "LKR"): Promise<KaprukaProduct | null> {
  try {
    const text = await callKaprukaTool("kapruka_get_product", {
      product_id: productId,
      currency,
      response_format: "json",
    });
    return parseToolJson<KaprukaProduct>(text);
  } catch {
    resetMcpSession();
    return null;
  }
}

export async function listCategories(depth = 1): Promise<KaprukaCategory[]> {
  try {
    const text = await callKaprukaTool("kapruka_list_categories", {
      depth,
      response_format: "json",
    });
    const data = parseToolJson<{ categories: KaprukaCategory[] } | KaprukaCategory[]>(text);
    if (Array.isArray(data)) return data;
    return data?.categories ?? [];
  } catch {
    resetMcpSession();
    return [];
  }
}

export async function listDeliveryCities(query: string, limit = 20): Promise<DeliveryCity[]> {
  try {
    const text = await callKaprukaTool("kapruka_list_delivery_cities", {
      query,
      limit,
      response_format: "json",
    });
    const data = parseToolJson<{ cities: DeliveryCity[] }>(text);
    return data?.cities ?? [];
  } catch {
    resetMcpSession();
    return [];
  }
}

export async function checkDelivery(args: {
  city: string;
  delivery_date: string;
  product_id?: string;
}): Promise<DeliveryCheckResult> {
  try {
    const text = await callKaprukaTool("kapruka_check_delivery", {
      ...args,
      response_format: "json",
    });
    return parseToolJson<DeliveryCheckResult>(text) ?? { city: args.city, checked_date: args.delivery_date, available: false, reason: text };
  } catch {
    resetMcpSession();
    return { city: args.city, checked_date: args.delivery_date, available: false, reason: "Could not check delivery" };
  }
}

export async function createOrder(args: {
  cart: Array<{ product_id: string; quantity: number }>;
  recipient: { name: string; phone: string };
  delivery: {
    address: string;
    city: string;
    date: string;
    location_type?: string;
    instructions?: string;
  };
  sender: { name: string; anonymous?: boolean };
  gift_message?: string;
  currency?: string;
}): Promise<{ checkout_url?: string; order_ref?: string }> {
  const text = await callKaprukaTool("kapruka_create_order", {
    ...args,
    response_format: "json",
  });
  const data = parseToolJson<{ checkout_url?: string; order_ref?: string }>(text);
  if (!data?.checkout_url) {
    throw new Error(text || "Order creation failed");
  }
  return data;
}

export async function trackOrder(orderNumber: string): Promise<TrackOrderResult> {
  try {
    const text = await callKaprukaTool("kapruka_track_order", {
      order_number: orderNumber,
      response_format: "json",
    });
    const data = parseToolJson<TrackOrderResult>(text);
    if (data) return data;
    return { raw: text, order_number: orderNumber };
  } catch {
    resetMcpSession();
    return { order_number: orderNumber, raw: "Unable to track order right now." };
  }
}
