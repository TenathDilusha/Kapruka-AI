from __future__ import annotations

import operator
from typing import Annotated, Any, Literal, TypedDict

from langgraph.graph import END, StateGraph

from app.agents.gift_designer import run_gift_designer
from app.agents.nodes.router import compose_reply_llm, extract_intent_llm, route_next_agent
from app.agents.product_strategy import run_product_strategy
from app.memory.store import get_memory
from app.mcp.client import get_mcp_client
from app.models.schemas import (
    ConversationResult,
    EnrichedBundle,
    GiftDesignerResult,
    IntentResult,
    KaprukaProduct,
    ProductStrategyResult,
)


class GraphState(TypedDict, total=False):
    session_id: str
    user_message: str
    history: list[dict[str, str]]
    cart_item_count: int
    facts: dict[str, Any]

    intent: IntentResult | None
    gifts: GiftDesignerResult
    strategy: ProductStrategyResult
    products: list[KaprukaProduct]
    bundles: list[EnrichedBundle]
    conversation: ConversationResult

    next_agent: str
    agent_trace: Annotated[list[str], operator.add]
    done: bool


def _to_product(raw: dict[str, Any]) -> KaprukaProduct:
    return KaprukaProduct(
        id=raw.get("id", ""),
        name=raw.get("name", "Unknown"),
        summary=raw.get("summary"),
        price=raw.get("price") or {"amount": None, "currency": "LKR"},
        image_url=raw.get("image_url"),
        url=raw.get("url"),
        in_stock=bool(raw.get("in_stock", True)),
        category=raw.get("category"),
    )


def _dedupe(products: list[KaprukaProduct]) -> list[KaprukaProduct]:
    seen: set[str] = set()
    out: list[KaprukaProduct] = []
    for p in products:
        if p.id and p.id not in seen:
            seen.add(p.id)
            out.append(p)
    return out


async def router_node(state: GraphState) -> GraphState:
    trace = state.get("agent_trace") or []
    intent = state.get("intent")
    gifts = state.get("gifts") or GiftDesignerResult()
    products = state.get("products") or []

    decision = await route_next_agent(
        user_message=state["user_message"],
        history=state.get("history") or [],
        facts=state.get("facts") or {},
        has_intent=bool(intent and (intent.occasion or intent.recipient or intent.budget_max)),
        has_bundles=bool(gifts.bundles),
        has_products=bool(products),
        trace=trace,
    )
    return {"next_agent": decision.next_agent}


async def intent_node(state: GraphState) -> GraphState:
    intent = await extract_intent_llm(
        state["user_message"],
        state.get("history") or [],
        state.get("facts") or {},
    )
    facts = dict(state.get("facts") or {})
    if intent.occasion:
        facts["occasion"] = intent.occasion
    if intent.recipient:
        facts["recipient"] = intent.recipient
    if intent.budget_max is not None:
        facts["budget_max"] = intent.budget_max
    if intent.language:
        facts["language"] = intent.language
    return {"intent": intent, "facts": facts, "agent_trace": ["intent"]}


async def gift_designer_node(state: GraphState) -> GraphState:
    intent = state.get("intent")
    if intent is None:
        intent = await extract_intent_llm(
            state["user_message"], state.get("history") or [], state.get("facts") or {}
        )
    gifts = run_gift_designer(intent)
    return {"intent": intent, "gifts": gifts, "agent_trace": ["gift_designer"]}


async def commerce_node(state: GraphState) -> GraphState:
    intent = state.get("intent")
    if intent is None:
        intent = await extract_intent_llm(
            state["user_message"], state.get("history") or [], state.get("facts") or {}
        )
    gifts = state.get("gifts") or run_gift_designer(intent)
    strategy = run_product_strategy(state["user_message"], intent, gifts)

    mcp = get_mcp_client()
    raw_products: list[KaprukaProduct] = []
    enriched: list[EnrichedBundle] = []

    for search in strategy.searches[:4]:
        for raw in mcp.search_products(
            search.query,
            category=search.category,
            max_price=search.max_price,
            limit=8,
        ):
            raw_products.append(_to_product(raw))

    for bundle in gifts.bundles[:2]:
        bundle_products: list[KaprukaProduct] = []
        for item in bundle.items[:4]:
            for raw in mcp.search_products(
                item.search_query,
                category=item.category,
                max_price=intent.budget_max,
                limit=5,
            ):
                bundle_products.append(_to_product(raw))
        enriched.append(EnrichedBundle(**bundle.model_dump(), products=_dedupe(bundle_products)[:8]))

    memory = get_memory(state["session_id"])
    products = _dedupe(raw_products)[:16]
    memory.last_products = [p.model_dump() for p in products]
    memory.last_bundles = [b.model_dump() for b in enriched]

    return {
        "intent": intent,
        "gifts": gifts,
        "strategy": strategy,
        "products": products,
        "bundles": enriched,
        "agent_trace": ["commerce"],
    }


async def conversation_node(state: GraphState) -> GraphState:
    intent = state.get("intent")
    if intent is None:
        intent = await extract_intent_llm(
            state["user_message"], state.get("history") or [], state.get("facts") or {}
        )
    gifts = state.get("gifts") or run_gift_designer(intent)
    products = state.get("products") or []
    bundles = state.get("bundles") or []

    msg, follow_ups, lang = await compose_reply_llm(
        message=state["user_message"],
        facts=state.get("facts") or {},
        product_count=len(products),
        bundle_count=len(bundles) or len(gifts.bundles),
        language=intent.language,
    )
    if follow_ups and not products:
        msg += "\n\n" + "\n".join(f"• {q}" for q in follow_ups[:2])

    conversation = ConversationResult(message=msg, language=lang, follow_up_questions=follow_ups)  # type: ignore[arg-type]
    memory = get_memory(state["session_id"])
    memory.record_turn("assistant", conversation.message)

    return {"conversation": conversation, "agent_trace": ["conversation"], "done": True}


def pick_next(state: GraphState) -> str:
    nxt = state.get("next_agent", "finish")
    trace = state.get("agent_trace") or []
    if state.get("done"):
        return END
    if nxt == "finish":
        return END
    if nxt in trace:
        return "conversation" if "conversation" not in trace else END
    return nxt


def build_graph():
    g = StateGraph(GraphState)
    g.add_node("router_agent", router_node)
    g.add_node("intent_agent", intent_node)
    g.add_node("gift_designer_agent", gift_designer_node)
    g.add_node("commerce_agent", commerce_node)
    g.add_node("conversation_agent", conversation_node)

    g.set_entry_point("router_agent")
    g.add_conditional_edges(
        "router_agent",
        pick_next,
        {
            "intent": "intent_agent",
            "gift_designer": "gift_designer_agent",
            "commerce": "commerce_agent",
            "conversation": "conversation_agent",
            END: END,
        },
    )
    for node in ("intent_agent", "gift_designer_agent", "commerce_agent"):
        g.add_edge(node, "router_agent")
    g.add_edge("conversation_agent", END)

    return g.compile()


_graph = None


def get_graph():
    global _graph
    if _graph is None:
        _graph = build_graph()
    return _graph
