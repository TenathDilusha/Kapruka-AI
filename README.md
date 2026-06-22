# Tharu AI

AI shopping agent for the [Kapruka Agent Challenge](https://mcp.kapruka.com). A full-screen conversational gift concierge — discover products, get curated bundles, and checkout via the live Kapruka MCP.

## Architecture

| Service | Role |
|---------|------|
| `frontend` | React + Vite chat UI with product cards & gift bundles |
| `backend-express` | Orchestration — sessions, cart, Kapruka MCP, Python bridge |
| `backend-python` | AI agents — intent, gift design, product strategy, conversation |

**Flow:** User message → Express → Python agents (structured JSON) → Kapruka MCP product search → rich response to frontend.

## Requirements

- Node.js 20+
- Python 3.12+

## Setup

```bash
npm install

cd backend-python
python3 -m venv .venv
source .venv/bin/activate
python3 -m pip install -r requirements.txt
```

Copy `.env.example` to `.env` in `backend-express` and `frontend` if needed.

## Run

Three terminals:

```bash
# Frontend — http://localhost:5173
npm run dev:frontend

# Express — http://localhost:3001
npm run dev:express

# Python agents — http://localhost:8000
cd backend-python && ./scripts/dev.sh
```

Try: *"Birthday gift for mom under 5000"* or *"Anniversary roses and chocolates"*

Health: `GET /health` on both backends.
