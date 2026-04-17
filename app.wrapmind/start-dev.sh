#!/bin/bash
# wrapmind dev server launcher
# Reads .env (gitignored) and passes vars to Vite.
# Usage: ./start-dev.sh [vite args...]
#
# Auth modes (from LOCAL_DEV):
#   1  = prototype mode (localStorage seed data, skip Supabase)
#   0  = local Supabase Docker auth
#   unset = production Supabase

set -e

APP_DIR="$(cd "$(dirname "$0")" && pwd)"
ENV_FILE="$APP_DIR/.env"

# Load .env if it exists
if [[ -f "$ENV_FILE" ]]; then
  set -a
  source "$ENV_FILE"
  set +a
fi

cd "$APP_DIR"

echo "[wrapmind] VITE_SUPABASE_URL=${VITE_SUPABASE_URL:-'(default: production)'}"
echo "[wrapmind] LOCAL_DEV=${LOCAL_DEV:-'(unset -> production)'}"
echo "[wrapmind] Starting Vite..."

exec node_modules/.bin/vite --host 0.0.0.0 "$@"
