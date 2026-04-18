# ShopMonkey Import TUI

A terminal UI for migrating data from the ShopMonkey API into WrapOS `sm_import_*` staging tables.

## Setup

```bash
cd tools-tui
npm install
```

Copy the env template:

```bash
cp .env.example .env
```

Then fill in `.env` with your values (or use the TUI form directly).

## Run

```bash
node shopmonkey-import.js
```

## First Time Setup

1. Launch the TUI
2. Fill in the form fields:
   - **ShopMonkey Token** — from ShopMonkey → Settings → API Access
   - **Supabase URL** — `http://wrapos.cloud:54321` (local) or `https://nbewyeoiizlsfmbqoist.supabase.co` (production)
   - **Supabase Service Role Key** — run `supabase status` locally to get it
   - **Org ID** — shown in the TUI after creation, or query `organizations` table
   - **Location ID** — optional, filter to a specific ShopMonkey location
3. Click **Test Connection** to verify both APIs are reachable
4. Click **Start Import** to begin migration

## Screens

- **Config Form** — enter/edit all environment variables, test connections
- **Import Progress** — live progress bar, phase label, and scrolling log output

## What Gets Imported

| Entity | Table |
|---|---|
| Customers | `sm_import_customers` |
| Vehicles | `sm_import_vehicles` |
| Labor Rates | `sm_import_labor_rates` |
| Orders | `sm_import_orders` |
| Order Lines | `sm_import_order_lines` |

All records are upserted — re-running is safe.

## Controls

| Key | Action |
|---|---|
| `Tab` | Move between fields |
| `Enter` | Activate button / confirm |
| `Escape` | Return to config screen (from import view) |
| `Ctrl+C` | Exit |

## Finding Your IDs

```bash
# Org ID
curl -s "http://wrapos.cloud:54321/rest/v1/organizations?select=id,name" \
  -H "apikey: <your-service-role-key>" \
  -H "Authorization: Bearer <your-service-role-key>"

# Location ID
curl -s "http://wrapos.cloud:54321/rest/v1/locations?select=id,name,org_id" \
  -H "apikey: <your-service-role-key>" \
  -H "Authorization: Bearer <your-service-role-key>"
```
