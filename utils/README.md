# ShopMonkey → WrapOS Migration

Run this script **from your local machine** to migrate data from the ShopMonkey API into your local WrapOS Supabase instance (`wrapos.cloud:54321`).

---

## Prerequisites

- Node.js >= 20
- `SHOPMONKEY_TOKEN` from your ShopMonkey account (Settings → API Access)
- `SUPABASE_SERVICE_ROLE_KEY` from your local Supabase (run `supabase status` locally to get it)

---

## Quick Start

```bash
cd ~/wrapmind
git pull

SHOPMONKEY_TOKEN=<your-shopmonkey-token> \
SUPABASE_URL=http://wrapos.cloud:54321 \
SUPABASE_SERVICE_ROLE_KEY=<your-local-service-role-key> \
ORG_ID=571bcc90-165a-479e-a126-ef3ce56e17d5 \
LOCATION_ID=85798b11-c872-409f-82f3-8ddb1a5db5a6 \
node utils/sm-migrate.js
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `SHOPMONKEY_TOKEN` | Yes | ShopMonkey bearer JWT from Settings → API Access |
| `SUPABASE_URL` | Yes | Local: `http://wrapos.cloud:54321` / Production: `https://nbewyeoiizlsfmbqoist.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key (not the anon key) |
| `ORG_ID` | Yes | Target `organizations.id` in WrapOS |
| `LOCATION_ID` | No | Filter to a specific ShopMonkey location. Omit to import all locations |
| `DRY_RUN` | No | Set `true` to fetch from ShopMonkey but not write to Supabase |
| `VERBOSE` | No | Set `true` to log every batch upserted |
| `SM_API_BASE` | No | Defaults to `https://api.shopmonkey.cloud/api/v3` |

---

## Dry Run (Fetch Only)

```bash
DRY_RUN=true VERBOSE=true \
SHOPMONKEY_TOKEN=<your-shopmonkey-token> \
SUPABASE_URL=http://wrapos.cloud:54321 \
SUPABASE_SERVICE_ROLE_KEY=<your-local-service-role-key> \
ORG_ID=571bcc90-165a-479e-a126-ef3ce56e17d5 \
LOCATION_ID=85798b11-c872-409f-82f3-8ddb1a5db5a6 \
node utils/sm-migrate.js
```

---

## Finding Your IDs

### ORG_ID and LOCATION_ID

Run against your local Supabase:

```bash
curl -s "http://wrapos.cloud:54321/rest/v1/organizations?select=id,name" \
  -H "apikey: <your-service-role-key>" \
  -H "Authorization: Bearer <your-service-role-key>"
```

```bash
curl -s "http://wrapos.cloud:54321/rest/v1/locations?select=id,name,org_id" \
  -H "apikey: <your-service-role-key>" \
  -H "Authorization: Bearer <your-service-role-key>"
```

### SUPABASE_SERVICE_ROLE_KEY

```bash
cd ~/wrapmind
supabase status
# Copy the value shown for: service_role key
```

### SHOPMONKEY_TOKEN

In ShopMonkey: **Settings → API Access**. Copy the full bearer JWT token.

---

## What Gets Imported

| Entity | Table | Notes |
|---|---|---|
| Customers | `sm_import_customers` | Name, phone, email, address |
| Vehicles | `sm_import_vehicles` | Year/make/model, VIN, color, plate |
| Labor Rates | `sm_import_labor_rates` | Name and hourly rate |
| Orders | `sm_import_orders` | Status, totals, labor/parts breakdown |
| Order Lines | `sm_import_order_lines` | Per-line description, quantity, price |

All records are upserted (`ON CONFLICT DO UPDATE`) so re-running is safe and picks up changes.

On success, `organizations.sm_last_synced_at` is updated and a row is written to `sm_import_log`.

---

## Import All Locations (No Filter)

```bash
SHOPMONKEY_TOKEN=<your-shopmonkey-token> \
SUPABASE_URL=http://wrapos.cloud:54321 \
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key> \
ORG_ID=571bcc90-165a-479e-a126-ef3ce56e17d5 \
node utils/sm-migrate.js
# Note: LOCATION_ID is omitted
```

---

## Troubleshooting

**HTTP 403 from ShopMonkey:**  
Your network is being blocked by Cloudflare. Run the script from your local machine (residential ISP), not from a cloud environment.

**HTTP 401 from Supabase:**  
Verify your `SUPABASE_SERVICE_ROLE_KEY` is correct — not the anon key.

**No data imported:**  
Check that `ORG_ID` matches the `organizations.id` in your local Supabase. Use the ID lookup queries above to confirm.

**Orders slow:**  
The script fetches order lines per-order (N+1). For large shops this is the bottleneck. It's safe to Ctrl+C and re-run — already-imported orders will be updated, not duplicated.
