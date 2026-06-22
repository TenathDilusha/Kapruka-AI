# Tharu AI

AI shopping agent for the [Kapruka Agent Challenge](https://mcp.kapruka.com). A conversational chat UI that helps customers discover products, get delivery quotes, and checkout via the Kapruka MCP.

Monorepo with three services:

- `frontend` — React + Vite
- `backend-express` — Express.js API
- `backend-python` — FastAPI API

## Requirements

- Node.js 20+
- Python 3.12+

## Setup

```bash
# Install JS dependencies (root + workspaces)
npm install

# Python backend
cd backend-python
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Copy `.env.example` to `.env` in each backend folder when you add config.

## Run

Open three terminals:

```bash
# Frontend — http://localhost:5173
npm run dev:frontend

# Express — http://localhost:3001
npm run dev:express

# FastAPI — http://localhost:8000
cd backend-python && ./scripts/dev.sh
```

Health checks: `GET /health` on both backends.
