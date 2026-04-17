#!/bin/bash
# wrapmind dev server launcher
# Usage: ./start-dev.sh [vite args...]
#
# Auth modes (from VITE_LOCAL_DEV):
#   1  = prototype mode (localStorage seed data, skip Supabase)
#   0  = local Supabase Docker auth
#   unset = production Supabase

set -e
APP_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$APP_DIR"

# Local dev defaults — override by setting env vars before calling
VITE_LOCAL_DEV="${VITE_LOCAL_DEV:-0}"
VITE_SUPABASE_URL="${VITE_SUPABASE_URL:-http://wrapos.cloud:54321}"
VITE_SUPABASE_ANON_KEY="${VITE_SUPABASE_ANON_KEY:-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJodHRwOi8vMTI3LjAuMC4xOjU0MzIxL2F1dGgvdjEiLCJyZWYiOiJ3cmFwbWluZCIsInJvbGUiOiJhbm9uIiwiZXhwIjoxNzc2NDU0MzY1fQ.QPtw6xT3fRzuTxfdn7CWsMeotxpIViddPJYAxSwHqYY}"

echo "[wrapmind] VITE_LOCAL_DEV=$VITE_LOCAL_DEV"
echo "[wrapmind] VITE_SUPABASE_URL=$VITE_SUPABASE_URL"
echo "[wrapmind] Starting Vite..."

exec node_modules/.bin/vite --host 0.0.0.0 "$@"
