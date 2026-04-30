#!/bin/bash
# wrapmind dev server launcher
# Usage: ./start-dev.sh [vite args...]
#
# Local dev starts Vite with Supabase Docker endpoint by default.
set -e
APP_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$APP_DIR"

# Local dev defaults — override by setting env vars before calling
VITE_SUPABASE_URL="${VITE_SUPABASE_URL:-http://wrapos.cloud:54321}"
VITE_SUPABASE_ANON_KEY="${VITE_SUPABASE_ANON_KEY:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwOi8vMTI3LjAuMC4xOjU0MzIxL2F1dGgvdjEiLCJyZWYiOiJ3cmFwbWluZCIsInJvbGUiOiJhbm9uIiwiZXhwIjoxNzc2NDU0MzY1fQ.QPtw6xT3fRzuTxfdn7CWsMeotxpIViddPJYAxSwHqYY}"

echo "[wrapmind] VITE_SUPABASE_URL=$VITE_SUPABASE_URL"
echo "[wrapmind] Starting Vite..."

exec node_modules/.bin/vite --host 0.0.0.0 "$@"
