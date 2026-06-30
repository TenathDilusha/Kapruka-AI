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

<<<<<<< HEAD
## Deploy on Render

### Express (`backend-express`)
=======
## Production hosting

| Service | URL |
|---------|-----|
| Frontend (Vercel) | `https://kapruka-ai-frontend.vercel.app` |
| Express (Render) | `https://kapruka-ai-1.onrender.com` |
| Python (Render) | `https://kapruka-ai.onrender.com` |

### Vercel (frontend)

- **Root Directory:** `frontend`
- **Framework:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`

| Environment variable | Value |
|---------------------|--------|
| `VITE_API_URL` | `https://kapruka-ai-1.onrender.com` |

Redeploy after changing `VITE_*` variables (they are baked in at build time).

### Render — Express (`kapruka-ai-1`)
>>>>>>> 8da9b88 (Pin Python 3.12 for Render deploy)

| Setting | Value |
|---------|--------|
| Root Directory | `backend-express` |
| Build Command | `npm install --include=dev && npm run build` |
| Start Command | `npm start` |
<<<<<<< HEAD
| Health Check | `/health` |

**Environment variables**

| Variable | Example |
|----------|---------|
| `PYTHON_AGENT_URL` | `https://your-python-service.onrender.com` |
| `FRONTEND_URL` | `https://your-frontend.onrender.com` |
| `KAPRUKA_MCP_URL` | `https://mcp.kapruka.com/mcp` |

`PORT` is set automatically by Render. Do **not** use `yarn start` alone — you must run `npm run build` so `dist/index.js` exists.

### Python (`backend-python`)
=======

| Environment variable | Value |
|---------------------|--------|
| `PYTHON_AGENT_URL` | `https://kapruka-ai.onrender.com` |
| `FRONTEND_URL` | `https://kapruka-ai-frontend.vercel.app` |
| `ALLOW_VERCEL_PREVIEWS` | `true` |
| `PYTHON_AGENT_TIMEOUT_MS` | `120000` |
| `KAPRUKA_MCP_URL` | `https://mcp.kapruka.com/mcp` |

### Render — Python (`kapruka-ai`)
>>>>>>> 8da9b88 (Pin Python 3.12 for Render deploy)

| Setting | Value |
|---------|--------|
| Root Directory | `backend-python` |
| Build Command | `pip install -r requirements.txt` |
| Start Command | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
<<<<<<< HEAD
| Health Check | `/health` |

Set `OPENAI_API_KEY` in Render environment variables.

Or use the repo `render.yaml` blueprint for both services.
=======

| Environment variable | Value |
|---------------------|--------|
| `PYTHON_VERSION` | `3.12.8` |
| `OPENAI_API_KEY` | your OpenAI key |
| `OPENAI_MODEL` | `gpt-4o-mini` |
| `KAPRUKA_MCP_URL` | `https://mcp.kapruka.com/mcp` |

Render defaults to Python 3.14, which breaks `pydantic-core` (Rust build). Pin **3.12.8** via `PYTHON_VERSION` or `backend-python/runtime.txt`.

### Smoke test

```bash
curl https://kapruka-ai.onrender.com/health
curl https://kapruka-ai-1.onrender.com/health
```

Then open the Vercel frontend and send a chat message. First request after idle may take ~30–60s while Render free instances wake up.
>>>>>>> 8da9b88 (Pin Python 3.12 for Render deploy)
