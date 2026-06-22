from __future__ import annotations

import re

from app.agents.intent import IntentResult
from app.models.schemas import GiftDesignerResult, ProductStrategyResult, SearchQuery


CHECKOUT_PATTERNS = ["checkout", "place order", "pay now", "order now", "ගෙව", "order ekak"]
CART_PATTERNS = ["add to cart", "add this", "cart", "ගෙනියන්න"]


def run_product_strategy(
    message: str,
    intent: IntentResult,
    gifts: GiftDesignerResult,
) -> ProductStrategyResult:
    lower = message.lower()

    if any(p in lower for p in CHECKOUT_PATTERNS):
        return ProductStrategyResult(action="none", rationale="User wants checkout")

    searches: list[SearchQuery] = []
    categories: list[str] = []

    # Direct product mentions in message
    product_terms = re.findall(
        r"(cake|chocolate|flowers?|roses?|hamper|gift|teddy|perfume|watch|jewelry|fruit basket)",
        lower,
    )
    for term in set(product_terms):
        searches.append(
            SearchQuery(
                query=term if term != "flowers" else "flowers bouquet",
                max_price=intent.budget_max,
            )
        )

    # From gift bundles
    if gifts.bundles and not searches:
        primary = gifts.bundles[0]
        for item in primary.items:
            searches.append(
                SearchQuery(
                    query=item.search_query,
                    category=item.category,
                    max_price=intent.budget_max,
                )
            )

    # Occasion-based fallback
    if not searches and intent.occasion:
        occasion_queries = {
            "birthday": "birthday gift",
            "anniversary": "anniversary gift",
            "wedding": "wedding gift",
            "valentine": "valentine gift",
            "new_baby": "baby gift",
            "thank_you": "thank you gift",
            "get_well": "get well soon gift",
            "graduation": "graduation gift",
            "housewarming": "housewarming gift",
        }
        q = occasion_queries.get(intent.occasion, "gift")
        searches.append(SearchQuery(query=q, max_price=intent.budget_max))

    if intent.budget_max and intent.budget_max < 5000:
        categories.append("Chocolates")

    action = "search" if searches else "none"
    return ProductStrategyResult(
        action=action,
        searches=searches[:4],
        categories=categories,
        rationale="Derived from intent, bundles, and message keywords",
    )
