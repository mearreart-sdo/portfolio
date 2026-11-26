#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
DIR="${1:-"$ROOT/dist"}"
PORT="${PORT:-8765}"

if [[ ! -d "$DIR" ]]; then
  echo "No $DIR — run ./build.sh first" >&2
  exit 1
fi

echo "Serving $DIR on http://127.0.0.1:$PORT/"
echo "Login page: http://127.0.0.1:$PORT/login.html"
echo "Password:   ${PASSWORD:-sfera-view}  (set via PASSWORD=... ./build.sh)"
exec ruby -run -e httpd "$DIR" -p "$PORT"
