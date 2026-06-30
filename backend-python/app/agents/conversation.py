from __future__ import annotations

from app.agents.intent import IntentResult
from app.models.schemas import ConversationResult, GiftDesignerResult, ProductStrategyResult


def run_conversation_agent(
    message: str,
    intent: IntentResult,
    gifts: GiftDesignerResult,
    strategy: ProductStrategyResult,
    product_count: int = 0,
) -> ConversationResult:
    lang = intent.language
    occasion = intent.occasion
    recipient = intent.recipient

    if "checkout" in message.lower() or "order" in message.lower():
        if lang == "si":
            return ConversationResult(
                message="හොඳයි! ඔබේ ඇණවුම සකස් කරමු. ලබන්නාගේ විස්තර සහ බෙදාහැරීමේ දිනය තවම නැත්නම් කියන්න.",
                language="si",
                follow_up_questions=["ලබන්නාගේ නම?", "බෙදාහැරීමේ නගරය?"],
            )
        if lang == "singlish":
            return ConversationResult(
                message="Nice one machan! Checkout ekata ready. Recipient details and delivery date dannamko?",
                language="singlish",
                follow_up_questions=["Recipient name?", "Delivery city?"],
            )
        return ConversationResult(
            message="Perfect — let's get you to checkout. Share the recipient name, address, city, and delivery date when you're ready.",
            language="en",
            follow_up_questions=["Who is this gift for?", "Which city should we deliver to?"],
        )

    if product_count > 0:
        if lang == "si":
            msg = f"මෙන්න ඔබට ගැලපෙන තෝරාගැනීම් {product_count}ක්! ඕනෑම එකක් cart එකට දාන්න — multi-item order එකක් හදන්න පුළුවන්."
        elif lang == "singlish":
            msg = f"Meka balanna machan — {product_count} options match wela. Cart ekata add karanna, multi-item order ekak hadanna puluwan!"
        else:
            msg = f"I found {product_count} picks for you. Add several to your cart — we'll ship them together in one Kapruka order."
        return ConversationResult(
            message=msg,
            language=lang,
            tone="excited",
            follow_up_questions=[
                "Want a gift message on the card?" if lang == "en" else "Gift message ekak oneda?" if lang == "singlish" else "Gift message එකක් ඕනද?",
                "Show cheaper options" if lang == "en" else "Lassana options" if lang == "singlish" else "වඩා අඩු මිලේ options",
                "Something for delivery tomorrow" if lang == "en" else "Heta deliver karanna puluwanda?" if lang == "singlish" else "හෙට deliver කරන්න පුළුවන්ද?",
            ],
        )  # type: ignore[arg-type]

    if gifts.bundles:
        primary = gifts.bundles[0]
        if lang == "si":
            msg = (
                f"මම '{primary.theme}' තේමාවක් සමඟ gift bundle එකක් සකස් කළා"
                f"{' — ' + occasion + ' සඳහා' if occasion else ''}. "
                f"{primary.emotional_description}"
            )
        elif lang == "singlish":
            msg = (
                f"Bro, '{primary.theme}' kiyala bundle ekak hadala thiyenawa"
                f"{f' — {occasion} ekata' if occasion else ''}. "
                f"{primary.emotional_description}"
            )
        else:
            who = f" for your {recipient}" if recipient else ""
            msg = (
                f"I've curated a '{primary.theme}' bundle{who}"
                f"{f' for this {occasion.replace('_', ' ')}' if occasion else ''}. "
                f"{primary.emotional_description}"
            )
        follow_ups = []
        if not intent.budget_max:
            follow_ups.append("What's your budget?" if lang == "en" else "Budget eka mokakda?")
        if not intent.recipient:
            follow_ups.append("Who is the gift for?" if lang == "en" else "මේ gift එක කාටද?")
        return ConversationResult(message=msg, language=lang, tone="warm", follow_up_questions=follow_ups)  # type: ignore[arg-type]

    if lang == "si":
        msg = "ආයුබෝවන්! මම තාරු — ඔබේ gift concierge. මොකක්ද occasion එක, සහ කාටද gift එක?"
    elif lang == "singlish":
        msg = "Hey! Tharu here — your gift concierge. Occasion eka mokakda, kattiya kiyala gift eka denna oneda?"
    else:
        msg = (
            "Hi, I'm Tharu — your Kapruka gift concierge. "
            "Tell me the occasion, who it's for, and your budget — I'll curate something special."
        )

    return ConversationResult(
        message=msg,
        language=lang,  # type: ignore[arg-type]
        tone="warm",
        follow_up_questions=[
            "What's the occasion?",
            "What's your budget?",
            "Who is the recipient?",
        ],
    )
