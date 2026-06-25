# Tharu AI

AI shopping agent for the [Kapruka Agent Challenge](https://mcp.kapruka.com). A full-screen conversational gift concierge — discover products, get curated bundles, and checkout via the live Kapruka MCP.

## Architecture

| Service | Role |
|---------|------|
| `frontend` | React + Vite chat UI with product cards & gift bundles |
| `backend-express` | Sessions, cart, SSE — thin proxy to Python agents |
| `backend-python` | **LangGraph multi-agent brain** — LLM routing, memory, direct Kapruka MCP |

**Flow:** User → Express (cart/session) → **Python LangGraph** → agents route dynamically → **MCP product search** → rich response → frontend

### Python agents (LangGraph)

| Agent | Role |
|-------|------|
| **Router** | LLM (or rules) picks next agent |
| **Intent** | Occasion, recipient, budget, language |
| **Gift Designer** | Emotional gift bundles |
| **Commerce** | Calls Kapruka MCP directly (`search_products`) |
| **Conversation** | Final multilingual reply |

Session memory persists facts across turns (`GET /agents/memory/{session_id}`).

## Requirements

- Node.js 20+
- Python 3.12+
- OpenAI API key (optional — falls back to rule-based agents)

## Setup

```bash
npm install

cd backend-python
python3 -m venv .venv
source .venv/bin/activate
python3 -m pip install -r requirements.txt
cp .env.example .env   # add OPENAI_API_KEY for LLM routing
```

Copy `.env.example` to `.env` in `backend-express` and `frontend` if needed.

## Run

```bash
npm run dev
```

Or three terminals:

```bash
npm run dev:frontend   # http://localhost:5173
npm run dev:express    # http://localhost:3001
npm run dev:python     # http://localhost:8000
```

Try: *"Birthday gift for mom under 5000"* or *"Anniversary roses and chocolates"*

Health: `GET /health` on both backends.
