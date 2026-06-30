from __future__ import annotations

import json
from typing import Any, Literal

from langchain_core.messages import HumanMessage, SystemMessage
from pydantic import BaseModel

from app.agents.conversation import run_conversation_agent
from app.agents.gift_designer import run_gift_designer
from app.agents.intent import run_intent_agent
from app.agents.product_strategy import run_product_strategy
from app.llm.client import get_llm
from app.models.schemas import IntentResult, RouterDecision


def _history_text(history: list[dict[str, str]]) -> str:
    lines = [f"{m['role']}: {m['content']}" for m in history[-8:]]
    return "\n".join(lines) if lines else "(no prior messages)"


def _facts_text(facts: dict[str, Any]) -> str:
    if not facts:
        return "(none yet)"
    return json.dumps(facts, ensure_ascii=False)


async def route_next_agent(
    *,
    user_message: str,
    history: list[dict[str, str]],
    facts: dict[str, Any],
    has_intent: bool,
    has_bundles: bool,
    has_products: bool,
    trace: list[str],
) -> RouterDecision:
    llm = get_llm()
    if llm is None:
        return _rule_router(
            user_message=user_message,
            facts=facts,
            has_intent=has_intent,
            has_bundles=has_bundles,
            has_products=has_products,
            trace=trace,
        )

    structured = llm.with_structured_output(RouterDecision)
    prompt = f"""You are the router for Tharu, a Kapruka gift-shopping AI.

Choose the NEXT single agent to run:
- intent: extract occasion, recipient, budget, language
- gift_designer: create emotional gift bundles
- commerce: search live Kapruka products via MCP
- conversation: write the final user-facing reply
- finish: stop (only if conversation already ran)

Already ran: {trace}
Known facts: {_facts_text(facts)}
Has intent: {has_intent}, bundles: {has_bundles}, products: {has_products}

Conversation:
{_history_text(history)}
user: {user_message}

Route intelligently. Typical flow: intent → gift_designer → commerce → conversation → finish.
If user asks to checkout, skip to conversation. If products already found, go to conversation."""

    try:
        decision = await structured.ainvoke(
            [
                SystemMessage(content="Return structured routing decision only."),
                HumanMessage(content=prompt),
            ]
        )
        if isinstance(decision, RouterDecision):
            return decision
    except Exception:
        pass

    return _rule_router(
        user_message=user_message,
        facts=facts,
        has_intent=has_intent,
        has_bundles=has_bundles,
        has_products=has_products,
        trace=trace,
    )


def _rule_router(
    *,
    user_message: str,
    facts: dict[str, Any],
    has_intent: bool,
    has_bundles: bool,
    has_products: bool,
    trace: list[str],
) -> RouterDecision:
    lower = user_message.lower()
    if "conversation" in trace:
        return RouterDecision(next_agent="finish", reason="Reply composed")

    if "commerce" not in trace and has_bundles and not has_products:
        return RouterDecision(next_agent="commerce", reason="Search Kapruka for bundle items")

    if "gift_designer" not in trace and has_intent and facts.get("occasion") and not has_bundles:
        return RouterDecision(next_agent="gift_designer", reason="Design gift bundles")

    if "intent" not in trace and not has_intent:
        return RouterDecision(next_agent="intent", reason="Understand user goals")

    if "commerce" not in trace and any(w in lower for w in ["cake", "flower", "gift", "chocolate", "roses"]):
        return RouterDecision(next_agent="commerce", reason="User mentioned products")

    if "conversation" not in trace:
        return RouterDecision(next_agent="conversation", reason="Respond to user")

    return RouterDecision(next_agent="finish", reason="Done")


class LLMIntentOutput(BaseModel):
    occasion: str | None = None
    recipient: str | None = None
    relationship: str | None = None
    budget_min: float | None = None
    budget_max: float | None = None
    mood: str | None = None
    language: Literal["en", "si", "singlish"] = "en"
    confidence: float = 0.7
    keywords: list[str] = []


async def extract_intent_llm(
    message: str,
    history: list[dict[str, str]],
    facts: dict[str, Any],
) -> IntentResult:
    llm = get_llm()
    if llm is None:
        return run_intent_agent(message, history)

    structured = llm.with_structured_output(LLMIntentOutput)
    prompt = f"""Extract gift-shopping intent from the user message.
Support English, Sinhala script, and Singlish.
Merge with known session facts: {_facts_text(facts)}

History:
{_history_text(history)}

Latest message: {message}"""

    try:
        out = await structured.ainvoke([HumanMessage(content=prompt)])
        if isinstance(out, LLMIntentOutput):
            return IntentResult(**out.model_dump())
    except Exception:
        pass
    return run_intent_agent(message, history)


class LLMConversationOutput(BaseModel):
    message: str
    language: Literal["en", "si", "singlish"] = "en"
    follow_up_questions: list[str] = []


async def compose_reply_llm(
    *,
    message: str,
    facts: dict[str, Any],
    product_count: int,
    bundle_count: int,
    language: str,
) -> tuple[str, list[str], str]:
    llm = get_llm()
    if llm is None:
        intent = IntentResult(language=language)  # type: ignore[arg-type]
        gifts = run_gift_designer(intent)
        strategy = run_product_strategy(message, intent, gifts)
        conv = run_conversation_agent(message, intent, gifts, strategy, product_count)
        return conv.message, conv.follow_up_questions, conv.language

    structured = llm.with_structured_output(LLMConversationOutput)
    prompt = f"""You are Tharu — warm Kapruka gift concierge for Sri Lanka.
Write in the user's language ({language}): English, Sinhala script (සිංහල), or Tanglish/Singlish (mixed).
Use natural Sri Lankan Tanglish when language is singlish — e.g. "machan", "hari", "mokakda", "ekak".
When language is si, reply primarily in Sinhala (can mix common English gift terms).
Facts: {_facts_text(facts)}
Products found: {product_count}, bundles: {bundle_count}
Cart items in session: check if user is building multi-item cart — encourage adding complementary gifts.
User said: {message}
Be concise, warm, and guide toward cart, gift message, or checkout."""

    try:
        out = await structured.ainvoke([HumanMessage(content=prompt)])
        if isinstance(out, LLMConversationOutput):
            return out.message, out.follow_up_questions, out.language
    except Exception:
        pass

    intent = IntentResult(language=language)  # type: ignore[arg-type]
    gifts = run_gift_designer(intent)
    strategy = run_product_strategy(message, intent, gifts)
    conv = run_conversation_agent(message, intent, gifts, strategy, product_count)
    return conv.message, conv.follow_up_questions, conv.language
