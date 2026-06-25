from __future__ import annotations

import os
from functools import lru_cache

from dotenv import load_dotenv

load_dotenv()


@lru_cache
def get_settings() -> "Settings":
    return Settings()


class Settings:
    port: int = int(os.getenv("PORT", "8000"))
    openai_api_key: str = os.getenv("OPENAI_API_KEY", "")
    openai_model: str = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    kapruka_mcp_url: str = os.getenv("KAPRUKA_MCP_URL", "https://mcp.kapruka.com/mcp")
    llm_enabled: bool = os.getenv("LLM_ENABLED", "true").lower() in ("1", "true", "yes")

    @property
    def has_llm(self) -> bool:
        return self.llm_enabled and bool(self.openai_api_key)
