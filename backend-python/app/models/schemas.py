from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class AgentRequest(BaseModel):
    message: str
    session_id: str
    history: list[ChatMessage] = Field(default_factory=list)
    cart_item_count: int = 0
    language_hint: str | None = None


class IntentResult(BaseModel):
    occasion: str | None = None
    recipient: str | None = None
    relationship: str | None = None
    budget_min: float | None = None
    budget_max: float | None = None
    mood: str | None = None
    language: Literal["en", "si", "singlish"] = "en"
    confidence: float = 0.5
    keywords: list[str] = Field(default_factory=list)


class SearchQuery(BaseModel):
    query: str
    category: str | None = None
    max_price: float | None = None


class ProductStrategyResult(BaseModel):
    action: Literal["search", "browse_category", "none"] = "search"
    searches: list[SearchQuery] = Field(default_factory=list)
    categories: list[str] = Field(default_factory=list)
    rationale: str = ""


class BundleItem(BaseModel):
    label: str
    search_query: str
    category: str | None = None


class GiftBundle(BaseModel):
    id: str
    theme: str
    occasion: str
    emotional_description: str
    items: list[BundleItem]
    estimated_budget: str | None = None


class GiftDesignerResult(BaseModel):
    bundles: list[GiftBundle] = Field(default_factory=list)
    primary_occasion: str | None = None


class ConversationResult(BaseModel):
    message: str
    language: Literal["en", "si", "singlish"] = "en"
    tone: str = "warm"
    follow_up_questions: list[str] = Field(default_factory=list)


class AgentResponse(BaseModel):
    intent: IntentResult
    product_strategy: ProductStrategyResult
    gift_bundles: GiftDesignerResult
    conversation: ConversationResult
    needs_mcp_search: bool = False
    needs_checkout: bool = False
    suggested_cart_action: Literal["add", "checkout", "none"] = "none"
