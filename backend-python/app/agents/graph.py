from __future__ import annotations

from app.agents.gift_designer import run_gift_designer
from app.agents.langgraph_workflow import get_graph
from app.agents.nodes.router import extract_intent_llm
from app.agents.product_strategy import run_product_strategy
from app.memory.store import get_memory
from app.models.schemas import (
    AgentRequest,
    AgentResponse,
    ConversationResult,
    EnrichedBundle,
    GiftDesignerResult,
    IntentResult,
    ProductStrategyResult,
)


async def run_agent_graph(req: AgentRequest) -> AgentResponse:
    memory = get_memory(req.session_id)

    for msg in req.history:
        if not any(m.content == msg.content and m.role == msg.role for m in memory.messages):
            memory.messages.append(msg)

    memory.record_turn("user", req.message)

    history = [{"role": m.role, "content": m.content} for m in memory.messages]

    initial = {
        "session_id": req.session_id,
        "user_message": req.message,
        "history": history,
        "cart_item_count": req.cart_item_count,
        "facts": dict(memory.facts),
        "agent_trace": [],
        "products": [],
        "bundles": [],
        "done": False,
    }

    result = await get_graph().ainvoke(initial)

    intent: IntentResult = result.get("intent") or await extract_intent_llm(
        req.message, history, memory.facts
    )
    memory.update_facts(intent)

    gifts: GiftDesignerResult = result.get("gifts") or run_gift_designer(intent)
    strategy: ProductStrategyResult = result.get("strategy") or run_product_strategy(
        req.message, intent, gifts
    )
    conversation: ConversationResult = result.get("conversation") or ConversationResult(
        message="How can I help you find the perfect gift today?",
        language=intent.language,
    )

    products = result.get("products") or []
    bundles: list[EnrichedBundle] = result.get("bundles") or []
    if not bundles and gifts.bundles:
        bundles = [EnrichedBundle(**b.model_dump()) for b in gifts.bundles]

    trace = result.get("agent_trace") or []
    memory.agent_trace.extend(trace)

    lower = req.message.lower()
    needs_checkout = any(w in lower for w in ["checkout", "place order", "pay now", "order now", "ගෙව"])
    needs_search = bool(products)

    cart_action = "checkout" if needs_checkout and req.cart_item_count > 0 else (
        "add" if needs_search else "none"
    )

    if needs_checkout and req.cart_item_count > 0:
        conversation.message += (
            "\n\nTo complete checkout, share recipient name & phone, delivery address & city, "
            "delivery date (YYYY-MM-DD), and your name as sender."
        )

    return AgentResponse(
        intent=intent,
        product_strategy=strategy,
        gift_bundles=gifts,
        conversation=conversation,
        products=products,
        bundles=bundles,
        needs_mcp_search=needs_search,
        needs_checkout=needs_checkout,
        suggested_cart_action=cart_action,  # type: ignore[arg-type]
        agent_trace=trace,
        memory_summary=memory.summary(),
    )
