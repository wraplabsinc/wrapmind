# seed-test-org — Supabase Edge Function

Creates a brand-new demo/test organization called **"WrapMind Test Shop"** populated with realistic dummy data. Designed for local development, QA, and feature prototyping against a fresh, known database state.

---

## 📦 What it seeds

The function populates the following tables in dependency order:

1. **organizations** — the org itself (id: `6d182e47-3faa-4a04-11ff-6c4ad7d7f9c5`)
2. **locations** — business locations tied to the org
3. **employees** — staff records
4. **profiles** — employee user accounts (Auth)
5. **customers** — client records
6. **vehicles** — customer vehicles
7. **estimates** — repair estimates (references customers & locations)
8. **invoices** — invoices derived from estimates (references estimates)
9. **leads** — prospective customers
10. **appointments** — scheduled appointments
11. **gamification_events** — user achievements/points
12. **notifications** — in-app notifications

All records are fully linked with valid foreign keys.

---

## 🚀 Quickstart

### Prerequisites
- Production Supabase project: `nbewyeoiizlsfmbqoist`
- Service Role token (stored at `~/.supabase/access-token`, Admin-scoped PAT)
- `supabase` CLI installed and authenticated
- `psql` (PostgreSQL client) for manual cleanup

### Deploy (after code changes)
```bash
cd /home/duke/wrapmind
supabase functions deploy seed-test-org \
  --project-ref nbewyeoiizlsfmbqoist \
  --no-verify-jwt
```

### Execute (seed the database)
```bash
curl -X POST https://nbewyeoiizlsfmbqoist.supabase.co/functions/v1/seed-test-org \
  -H "Authorization: Bearer $(cat ~/.supabase/access-token)" \
  -H "Content-Type: application/json" \
  -d '{"refresh": true}'
```

**Success response:**
```json
{ "ok": true, "orgId": "6d182e47-3faa-4a04-11ff-6c4ad7d7f9c5" }
```

---

## 🛠️ Customization

All seeded data lives in `supabase/functions/seed-test-org/seed/`:

| File | Purpose |
|---|---|
| `seed_organizations.js` | Org definitions (currently only one) |
| `seed_locations.js` | Business locations |
| `seed_employees.js` | Employee records |
| `seed_profiles.js` | Auth users for employees |
| `seed_customers.js` | Customer records |
| `seed_vehicles.js` | Vehicles per customer |
| `seed_estimates.js` | Estimates (FK to customers/locations) |
| `seed_invoices.js` | Invoices (FK to estimates) |
| `seed_leads.js` | Lead records |
| `seed_appointments.js` | Appointments |
| `seed_gamification_events.js` | Events/achievements |
| `seed_notifications.js` | Notification records |

**To modify data:** edit the constants exported from these files. On next run, the old test org will be deleted and replaced with your updated seed.

**To add new org types:** duplicate an existing `seed_*.js` pattern and add a corresponding seeding loop in `index.ts`.

---

## 🔄 Idempotency

The function **guarantees a single test org** by:

1. Checking if an org named `"WrapMind Test Shop"` already exists.
2. If found, **deleting it first** (cascade deletes all related records).
3. Creating a fresh org and all dependent records.

This means you can run the function repeatedly without accumulating duplicate organizations.

---

## 🐛 Troubleshooting

### "Expression expected" or syntax errors in seed files
Make sure `.js` files end properly — no trailing commas after the last exported object. If a manual edit corrupts the file, restore from `seed-archive/`.

### FK constraint violations (invoices referencing missing estimates)
Ensure every `estimateId` referenced in `seed_invoices.js` has a matching entry in `seed_estimates.js`. The function checks this before insert; missing ones will be skipped with a warning.

### Order dependency errors
Tables are seeded in dependency order. If you add a new table with foreign keys, insert its seeding loop **after** the tables it references.

### Deploy fails
Run `supabase login` and ensure your PAT has Admin role on the project. The PAT at `~/.supabase/access-token` must be fresh (non-expired). regenerate from Supabase dashboard if needed.

### Function returns 401
Verify you're passing the PAT in the `Authorization` header and that the function is deployed with `--no-verify-jwt`.

---

## 🧹 Manual cleanup (if needed)

If the function crashes mid-execution and leaves partial data:

```bash
# Connect to prod DB
export PGPASSWORD='YOUR_DB_PASSWORD'
psql "postgresql://postgres:$PGPASSWORD@db.nbewyeoiizlsfmbqoist.supabase.co:5432/postgres?sslmode=require"

# In psql:
DELETE FROM organizations WHERE name = 'WrapMind Test Shop';
\q
```

This cascades and removes all dependent rows.

---

## 🔐 Auth & Security

- The Edge Function uses the **Service Role** to bypass RLS — it must be deployed with `--no-verify-jwt`.
- Triggers require a valid PAT token (Admin-scoped) in the `Authorization` header.
- **This function should NEVER be enabled on a public-facing production environment** — it's for dev/QA only.

---

## 📁 Project structure

```
supabase/functions/seed-test-org/
├── index.ts              # Main entry point, FK orchestration, insert loops
├── seed/                 # All seed data (constants exported from .js files)
│   ├── seed_organizations.js
│   ├── seed_locations.js
│   ├── seed_employees.js
│   ├── seed_profiles.js
│   ├── seed_customers.js
│   ├── seed_vehicles.js
│   ├── seed_estimates.js
│   ├── seed_invoices.js
│   ├── seed_leads.js
│   ├── seed_appointments.js
│   ├── seed_gamification_events.js
│   └── seed_notifications.js
├── seed-archive/         # Known-good backups of seed files
│   └── seed_estimates.js   # Original 12-estimate base (clean)
└── README.md             # This file
```

---

## 🧪 Verify seeding

After running the function, check record counts in the DB:

```bash
# Example:
psql "postgresql://postgres:$PGPASSWORD@db.nbewyeoiizlsfmbqoist.supabase.co:5432/postgres?sslmode=require" \
  -c "SELECT 'organizations' AS table, COUNT(*) FROM organizations WHERE name='WrapMind Test Shop' UNION ALL
      SELECT 'locations', COUNT(*) FROM locations WHERE org_id=(SELECT id FROM organizations WHERE name='WrapMind Test Shop') UNION ALL
      SELECT 'employees', COUNT(*) FROM employees WHERE org_id=(SELECT id FROM organizations WHERE name='WrapMind Test Shop') UNION ALL
      SELECT 'estimates', COUNT(*) FROM estimates WHERE org_id=(SELECT id FROM organizations WHERE name='WrapMind Test Shop') UNION ALL
      SELECT 'invoices', COUNT(*) FROM invoices WHERE org_id=(SELECT id FROM organizations WHERE name='WrapMind Test Shop');"
```

Expected match to seed file counts.

---

## 📝 Notes

- Org ID is stable: `6d182e47-3faa-4a04-11ff-6c4ad7d7f9c5` for the test org.
- The function uses **try/catch per insert** so that a single bad record doesn't abort the whole seed.
- Regex fix active: `replace(/\s+/g, '.')` on employee emails — correct syntax.

---

Last updated: 2026-04-28
