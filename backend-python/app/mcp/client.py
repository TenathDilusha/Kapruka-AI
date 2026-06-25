from __future__ import annotations

import json
import time
from typing import Any

import httpx

from app.config import get_settings

_settings = get_settings()
MCP_URL = _settings.kapruka_mcp_url


def _parse_body(text: str) -> dict[str, Any]:
    trimmed = text.strip()
    if trimmed.startswith("{"):
        return json.loads(trimmed)
    for line in trimmed.split("\n"):
        if line.startswith("data: "):
            payload = json.loads(line[6:])
            if "result" in payload or "error" in payload:
                return payload
    raise RuntimeError("Unable to parse MCP response")


def _extract_text(result: dict[str, Any]) -> str:
    content = result.get("content") or []
    for block in content:
        if block.get("type") == "text":
            return block.get("text") or ""
    return ""


class KaprukaMCPClient:
    def __init__(self) -> None:
        self._session_id: str | None = None
        self._client = httpx.Client(timeout=30.0)

    def _rpc(
        self,
        method: str,
        params: dict[str, Any] | None = None,
        *,
        notification: bool = False,
    ) -> dict[str, Any]:
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json, text/event-stream",
        }
        if self._session_id:
            headers["Mcp-Session-Id"] = self._session_id

        body: dict[str, Any] = {"jsonrpc": "2.0", "method": method, "params": params or {}}
        if not notification:
            body["id"] = int(time.time() * 1000)

        res = self._client.post(MCP_URL, headers=headers, json=body)
        new_sid = res.headers.get("mcp-session-id")
        if new_sid:
            self._session_id = new_sid

        if notification:
            return {}

        parsed = _parse_body(res.text)
        if parsed.get("error"):
            raise RuntimeError(parsed["error"].get("message", "MCP error"))
        return parsed.get("result") or {}

    def _ensure_session(self) -> None:
        if self._session_id:
            return
        self._rpc(
            "initialize",
            {
                "protocolVersion": "2024-11-05",
                "capabilities": {},
                "clientInfo": {"name": "tharu-ai-python", "version": "1.0.0"},
            },
        )
        self._rpc("notifications/initialized", notification=True)

    def call_tool(self, name: str, arguments: dict[str, Any]) -> str:
        self._ensure_session()
        result = self._rpc("tools/call", {"name": name, "arguments": arguments})
        return _extract_text(result)

    def search_products(
        self,
        q: str,
        *,
        category: str | None = None,
        max_price: float | None = None,
        limit: int = 6,
    ) -> list[dict[str, Any]]:
        args: dict[str, Any] = {
            "q": q,
            "limit": limit,
            "in_stock_only": True,
            "response_format": "json",
        }
        if category:
            args["category"] = category
        if max_price is not None:
            args["max_price"] = max_price

        text = self.call_tool("kapruka_search_products", {"params": args})
        if not text or text.startswith("Error:"):
            return []
        try:
            data = json.loads(text)
            return data.get("results") or []
        except json.JSONDecodeError:
            return []

    def list_categories(self) -> list[str]:
        text = self.call_tool("kapruka_list_categories", {"params": {"response_format": "json"}})
        try:
            data = json.loads(text)
            if isinstance(data, list):
                return [c.get("name", "") for c in data if c.get("name")]
        except json.JSONDecodeError:
            pass
        return []

    def check_delivery(self, city: str, delivery_date: str, product_id: str | None = None) -> dict[str, Any]:
        args: dict[str, Any] = {
            "city": city,
            "delivery_date": delivery_date,
            "response_format": "json",
        }
        if product_id:
            args["product_id"] = product_id
        text = self.call_tool("kapruka_check_delivery", {"params": args})
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            return {"raw": text}


_mcp_client: KaprukaMCPClient | None = None


def get_mcp_client() -> KaprukaMCPClient:
    global _mcp_client
    if _mcp_client is None:
        _mcp_client = KaprukaMCPClient()
    return _mcp_client
