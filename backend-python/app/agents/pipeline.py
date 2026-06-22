from __future__ import annotations

from app.agents.conversation import run_conversation_agent
from app.agents.gift_designer import run_gift_designer
from app.agents.intent import run_intent_agent
from app.agents.product_strategy import run_product_strategy
from app.models.schemas import AgentRequest, AgentResponse


def process_message(req: AgentRequest) -> AgentResponse:
    intent = run_intent_agent(req.message, req.history)
    gifts = run_gift_designer(intent)
    strategy = run_product_strategy(req.message, intent, gifts)

    lower = req.message.lower()
    needs_checkout = any(
        w in lower for w in ["checkout", "place order", "pay now", "order now", "ගෙව"]
    )
    needs_search = strategy.action == "search" and len(strategy.searches) > 0

    conversation = run_conversation_agent(req.message, intent, gifts, strategy)

    cart_action = "none"
    if needs_checkout and req.cart_item_count > 0:
        cart_action = "checkout"
    elif needs_search:
        cart_action = "add"

    return AgentResponse(
        intent=intent,
        product_strategy=strategy,
        gift_bundles=gifts,
        conversation=conversation,
        needs_mcp_search=needs_search,
        needs_checkout=needs_checkout,
        suggested_cart_action=cart_action,  # type: ignore[arg-type]
    )
