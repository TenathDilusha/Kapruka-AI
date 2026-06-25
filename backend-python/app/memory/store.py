from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from app.models.schemas import ChatMessage, IntentResult


@dataclass
class SessionMemory:
    session_id: str
    messages: list[ChatMessage] = field(default_factory=list)
    facts: dict[str, Any] = field(default_factory=dict)
    last_products: list[dict[str, Any]] = field(default_factory=list)
    last_bundles: list[dict[str, Any]] = field(default_factory=list)
    agent_trace: list[str] = field(default_factory=list)

    def record_turn(self, role: str, content: str) -> None:
        self.messages.append(ChatMessage(role=role, content=content))  # type: ignore[arg-type]
        if len(self.messages) > 40:
            self.messages = self.messages[-40:]

    def update_facts(self, intent: IntentResult) -> None:
        if intent.occasion:
            self.facts["occasion"] = intent.occasion
        if intent.recipient:
            self.facts["recipient"] = intent.recipient
        if intent.relationship:
            self.facts["relationship"] = intent.relationship
        if intent.budget_max is not None:
            self.facts["budget_max"] = intent.budget_max
        if intent.budget_min is not None:
            self.facts["budget_min"] = intent.budget_min
        if intent.language:
            self.facts["language"] = intent.language

    def summary(self) -> dict[str, Any]:
        return {
            "turns": len(self.messages),
            "facts": dict(self.facts),
            "agents_used": list(self.agent_trace),
        }


_store: dict[str, SessionMemory] = {}


def get_memory(session_id: str) -> SessionMemory:
    if session_id not in _store:
        _store[session_id] = SessionMemory(session_id=session_id)
    return _store[session_id]
