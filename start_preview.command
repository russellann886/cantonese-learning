#!/bin/zsh
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "$0")" && pwd)"
PORT=8080
URL="http://localhost:${PORT}/"
LOG_FILE="/tmp/cantonese-translation-preview.log"

is_proxy_ready() {
  curl -fsS "http://localhost:$1/api/health" >/dev/null 2>&1
}

if lsof -iTCP:${PORT} -sTCP:LISTEN >/dev/null 2>&1 && ! is_proxy_ready "${PORT}"; then
  while lsof -iTCP:${PORT} -sTCP:LISTEN >/dev/null 2>&1; do
    PORT=$((PORT + 1))
  done
  URL="http://localhost:${PORT}/"
  echo "Port 8080 is already in use by another process. Switching to ${URL}"
fi

if lsof -iTCP:${PORT} -sTCP:LISTEN >/dev/null 2>&1; then
  echo "Preview server already running: ${URL}"
else
  echo "Starting preview server: ${URL}"
  echo "Using OPENROUTER_API_KEY or GEMINI_API_KEY from current shell environment."
  nohup env PORT="${PORT}" python3 "${SCRIPT_DIR}/proxy_server.py" >"${LOG_FILE}" 2>&1 &
  sleep 1
fi

open "${URL}" >/dev/null 2>&1 || true
echo "Preview ready."
