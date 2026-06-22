from __future__ import annotations

import uuid

from app.agents.intent import IntentResult
from app.models.schemas import BundleItem, GiftBundle, GiftDesignerResult

BUNDLE_TEMPLATES: dict[str, list[dict]] = {
    "birthday": [
        {
            "theme": "Sweet Celebration",
            "description": "A joyful trio — cake, blooms, and a little surprise to make their day unforgettable.",
            "items": [
                {"label": "Birthday cake", "search_query": "birthday cake", "category": "Cakes"},
                {"label": "Fresh flowers", "search_query": "birthday flowers bouquet", "category": "Flowers"},
                {"label": "Chocolate treat", "search_query": "chocolate gift box", "category": None},
            ],
        },
        {
            "theme": "Party Starter Pack",
            "description": "For the friend who loves a proper celebration — edible joy plus something fun.",
            "items": [
                {"label": "Celebration cake", "search_query": "celebration cake", "category": "Cakes"},
                {"label": "Gift hamper", "search_query": "gift hamper", "category": None},
            ],
        },
    ],
    "anniversary": [
        {
            "theme": "Timeless Romance",
            "description": "Roses, fine chocolates, and a heartfelt note — classic love, Kapruka style.",
            "items": [
                {"label": "Red roses", "search_query": "red roses bouquet", "category": "Flowers"},
                {"label": "Luxury chocolates", "search_query": "luxury chocolate box", "category": None},
                {"label": "Greeting card", "search_query": "greeting card", "category": None},
            ],
        },
    ],
    "wedding": [
        {
            "theme": "Newlywed Bliss",
            "description": "Elegant flowers and a premium gift to celebrate their new chapter together.",
            "items": [
                {"label": "Wedding flowers", "search_query": "wedding bouquet", "category": "Flowers"},
                {"label": "Home gift", "search_query": "home decor gift", "category": None},
            ],
        },
    ],
    "valentine": [
        {
            "theme": "Heart & Soul",
            "description": "Romance in a bundle — roses, sweets, and something that says 'you matter'.",
            "items": [
                {"label": "Rose bouquet", "search_query": "valentine roses", "category": "Flowers"},
                {"label": "Chocolate hearts", "search_query": "heart chocolate", "category": None},
            ],
        },
    ],
    "new_baby": [
        {
            "theme": "Welcome Little One",
            "description": "Soft, sweet gifts for the newest family member and proud parents.",
            "items": [
                {"label": "Baby gift set", "search_query": "baby gift set", "category": None},
                {"label": "Congratulations flowers", "search_query": "new baby flowers", "category": "Flowers"},
            ],
        },
    ],
    "thank_you": [
        {
            "theme": "Grateful Heart",
            "description": "A thoughtful thank-you that feels personal, not generic.",
            "items": [
                {"label": "Thank you flowers", "search_query": "thank you bouquet", "category": "Flowers"},
                {"label": "Gourmet hamper", "search_query": "gourmet gift hamper", "category": None},
            ],
        },
    ],
    "default": [
        {
            "theme": "Kapruka Curated",
            "description": "A balanced mix of flowers, sweets, and a surprise — perfect when you're not sure yet.",
            "items": [
                {"label": "Flower bouquet", "search_query": "flower bouquet", "category": "Flowers"},
                {"label": "Chocolate box", "search_query": "chocolate gift", "category": None},
            ],
        },
    ],
}


def run_gift_designer(intent: IntentResult) -> GiftDesignerResult:
    occasion = intent.occasion or "default"
    templates = BUNDLE_TEMPLATES.get(occasion, BUNDLE_TEMPLATES["default"])

    bundles: list[GiftBundle] = []
    for tpl in templates[:2]:
        items = [BundleItem(**item) for item in tpl["items"]]
        budget = None
        if intent.budget_max:
            budget = f"LKR {intent.budget_max:,.0f} and below"
        bundles.append(
            GiftBundle(
                id=str(uuid.uuid4())[:8],
                theme=tpl["theme"],
                occasion=occasion if occasion != "default" else "any occasion",
                emotional_description=tpl["description"],
                items=items,
                estimated_budget=budget,
            )
        )

    return GiftDesignerResult(bundles=bundles, primary_occasion=intent.occasion)
