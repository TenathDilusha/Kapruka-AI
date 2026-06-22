const PYTHON_URL = process.env.PYTHON_AGENT_URL ?? "http://127.0.0.1:8000";

export interface AgentPayload {
  message: string;
  session_id: string;
  history: Array<{ role: "user" | "assistant"; content: string }>;
  cart_item_count: number;
}

export interface AgentResult {
  intent: {
    occasion: string | null;
    recipient: string | null;
    budget_max: number | null;
    language: string;
  };
  product_strategy: {
    action: string;
    searches: Array<{ query: string; category?: string; max_price?: number }>;
  };
  gift_bundles: {
    bundles: Array<{
      id: string;
      theme: string;
      occasion: string;
      emotional_description: string;
      items: Array<{ label: string; search_query: string; category?: string }>;
      estimated_budget?: string;
    }>;
  };
  conversation: {
    message: string;
    language: string;
    follow_up_questions: string[];
  };
  needs_mcp_search: boolean;
  needs_checkout: boolean;
  suggested_cart_action: string;
}

export async function callPythonAgent(payload: AgentPayload): Promise<AgentResult> {
  const res = await fetch(`${PYTHON_URL}/agents/process`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Python agent error: ${err}`);
  }

  return res.json() as Promise<AgentResult>;
}
