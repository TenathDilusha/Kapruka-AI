from __future__ import annotations

import re

from app.models.schemas import IntentResult

OCCASIONS = {
    "birthday": ["birthday", "bday", "janadina", "උපන්දින", "born day"],
    "anniversary": ["anniversary", "wedding anniversary", "සංවත්සර", "anniv"],
    "wedding": ["wedding", "marriage", "bride", "groom", "විවාහ", "porondam"],
    "valentine": ["valentine", "love", "romantic", "ප්‍රේම", "gf", "bf", "partner"],
    "new_baby": ["baby", "newborn", "shower", "infant", "දරු", "baby shower"],
    "graduation": ["graduation", "graduate", "degree", "convocation"],
    "thank_you": ["thank", "gratitude", "appreciate", "ස්තූතියි"],
    "get_well": ["get well", "sick", "hospital", "recover", "සුවපත්"],
    "housewarming": ["housewarming", "new home", "ගෙදර", "home gift"],
}

RELATIONSHIPS = {
    "mother": ["mom", "mother", "amma", "mummy", "අම්මා"],
    "father": ["dad", "father", "thaththa", "ආච්චි"],
    "partner": ["wife", "husband", "girlfriend", "boyfriend", "partner", "හොඳ්හිටම"],
    "friend": ["friend", "buddy", "mate", "යාළු", "friend ek"],
    "colleague": ["colleague", "boss", "coworker", "office"],
}

SINGLISH_MARKERS = ["mokak", "dan", "hari", "nane", "kohomada", "aiyoo", "machan", "bro", "deyak", "gift ekak"]


def _detect_language(text: str) -> str:
    if re.search(r"[\u0D80-\u0DFF]", text):
        return "si"
    lower = text.lower()
    if any(m in lower for m in SINGLISH_MARKERS) or re.search(r"\b(la|da|ne|ekak|kohomada)\b", lower):
        return "singlish"
    return "en"


def _extract_budget(text: str) -> tuple[float | None, float | None]:
    lower = text.lower().replace(",", "")
    patterns = [
        r"(?:under|below|max|less than)\s*(?:lkr|rs\.?|rupees?)?\s*(\d+)",
        r"(?:around|about|budget)\s*(?:lkr|rs\.?|rupees?)?\s*(\d+)",
        r"(?:lkr|rs\.?|rupees?)\s*(\d+)\s*(?:-|to)\s*(?:lkr|rs\.?|rupees?)?\s*(\d+)",
        r"(?:lkr|rs\.?|rupees?)\s*(\d+)",
    ]
    for i, pat in enumerate(patterns):
        m = re.search(pat, lower)
        if not m:
            continue
        if i == 2 and len(m.groups()) >= 2:
            return float(m.group(1)), float(m.group(2))
        val = float(m.group(1))
        if "under" in lower or "below" in lower or "max" in lower:
            return None, val
        return val * 0.7, val * 1.3
    return None, None


def _match_map(text: str, mapping: dict[str, list[str]]) -> str | None:
    lower = text.lower()
    for key, terms in mapping.items():
        if any(t in lower for t in terms):
            return key
    return None


def run_intent_agent(message: str, history: list) -> IntentResult:
    text = message.strip()
    language = _detect_language(text)
    occasion = _match_map(text, OCCASIONS)
    relationship = _match_map(text, RELATIONSHIPS)
    budget_min, budget_max = _extract_budget(text)

    recipient = None
    for rel, terms in RELATIONSHIPS.items():
        for t in terms:
            if t in text.lower():
                recipient = rel
                break

    keywords = [w for w in re.findall(r"[a-zA-Z\u0D80-\u0DFF]{3,}", text.lower()) if len(w) > 2][:8]

    confidence = 0.4
    if occasion:
        confidence += 0.25
    if relationship or recipient:
        confidence += 0.15
    if budget_max:
        confidence += 0.1

    return IntentResult(
        occasion=occasion,
        recipient=recipient or relationship,
        relationship=relationship,
        budget_min=budget_min,
        budget_max=budget_max,
        mood="thoughtful",
        language=language,  # type: ignore[arg-type]
        confidence=min(confidence, 0.95),
        keywords=keywords,
    )
