const MCP_URL = process.env.KAPRUKA_MCP_URL ?? "https://mcp.kapruka.com/mcp";

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

export interface KaprukaProduct {
  id: string;
  name: string;
  summary?: string;
  price: { amount: number | null; currency: string };
  image_url?: string | null;
  in_stock: boolean;
  url?: string;
  category?: { name: string };
}

function mcpToolArgs(params: Record<string, unknown>): Record<string, unknown> {
  return { params };
}

export async function searchProducts(args: {
  q: string;
  category?: string;
  max_price?: number;
  limit?: number;
}): Promise<KaprukaProduct[]> {
  const searchParams: Record<string, unknown> = {
    q: args.q,
    limit: args.limit ?? 6,
    in_stock_only: true,
    response_format: "json",
  };
  if (args.category) searchParams.category = args.category;
  if (args.max_price !== undefined) searchParams.max_price = args.max_price;

  try {
    const sessionId = await ensureSession();
    const { result } = await mcpRpc(
      "tools/call",
      {
        name: "kapruka_search_products",
        arguments: mcpToolArgs(searchParams),
      },
      sessionId,
    );

    const text = extractText(result);
    if (!text || text.startsWith("Error:")) return [];

    try {
      const data = JSON.parse(text) as { results: KaprukaProduct[] };
      return data.results ?? [];
    } catch {
      return [];
    }
  } catch {
    resetMcpSession();
    return [];
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
}): Promise<{ checkout_url?: string; order_ref?: string }> {
  const sessionId = await ensureSession();
  const { result } = await mcpRpc(
    "tools/call",
    {
      name: "kapruka_create_order",
      arguments: mcpToolArgs({ ...args, response_format: "json" }),
    },
    sessionId,
  );

  const text = extractText(result);
  if (!text || text.startsWith("Error:")) {
    throw new Error(text || "Order creation failed");
  }

  return JSON.parse(text) as { checkout_url?: string; order_ref?: string };
}

export async function checkDelivery(args: {
  city: string;
  delivery_date: string;
  product_id?: string;
}): Promise<unknown> {
  const sessionId = await ensureSession();
  const { result } = await mcpRpc(
    "tools/call",
    {
      name: "kapruka_check_delivery",
      arguments: mcpToolArgs({ ...args, response_format: "json" }),
    },
    sessionId,
  );

  const text = extractText(result);
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}
