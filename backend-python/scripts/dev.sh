#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

if [[ ! -d .venv ]]; then
  python3 -m venv .venv
fi

source .venv/bin/activate
python3 -m pip install -q -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port "${PORT:-8000}"
