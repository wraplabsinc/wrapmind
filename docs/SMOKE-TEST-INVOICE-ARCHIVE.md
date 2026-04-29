# Invoice Archive Smoke Test — Production

**Feature:** Soft-delete (Archive) for invoices — Issue #97
**Target:** Production (`nbewyeoiizlsfmbqoist`)
**Last validated:** 2026-04-28

---

## Quick Manual Test (Browser)

1. Log into WrapMind (admin user) in your browser.
2. Navigate to **Invoices** page (`/invoices`).
3. Click **New Invoice** → fill minimal data (customer, one line item) → **Save as Draft**.
4. Verify the invoice appears in the list with status **Draft**.
5. Open the invoice, click **Mark as Sent** → confirm.
6. Verify status changes to **Sent** and `issued_at` timestamp appears.
7. Click the **Archive** action (formerly "Delete").
8. Confirm theArchive dialog (blue button).
9. Verify the invoice **disappears** from the active list.
10. Navigate to the **Archive** view (if available) to confirm it appears there.
11. Done — the soft-delete pipeline is working end-to-end.

---

## Automated Smoke Test (Node.js script)

Located at: `scripts/smoke/invoice-archive-smoke.js`

**Purpose:** Programmatic verification of the GraphQL mutation flow: create → update → archive → list → cleanup.

### Prerequisites

- Node.js 18+
- `SUPABASE_SERVICE_ROLE_KEY` available in environment or `tools-tui/.env` (see below)
- Repo root: `/home/duke/wrapmind`

### Setup: Provide the service-role key

The script bypasses Row-Level Security using the service role key. Store the key in `tools-tui/.env`:

```bash
# Create the env file if missing
cat > /home/duke/wrapmind/tools-tui/.env << EOF
SUPABASE_SERVICE_ROLE_KEY=sb_secret_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
EOF
chmod 600 /home/duke/wrapmind/tools-tui/.env
```

(Replace the value with your actual service role key from Supabase dashboard → Project Settings → API.)

### Run

```bash
cd /home/duke/wrapmind
node scripts/smoke/invoice-archive-smoke.js
```

**Expected output:**

```
🚀 Invoice Soft-Delete Smoke Test — Production
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ Env OK — https://nbewyeoiizlsfmbqoist.supabase.co
▶ Fetch org
✓ Org: WRAPMIND (…)
▶ Create invoice
✓ Created INV-2026-XXXX | …
▶ Update → sent
✓ Marked as sent
▶ Archive
✓ deletedAt set — invoice archived
▶ List active
✓ Active count: N — archived invoice correctly excluded
▶ Cleanup
✓ Hard-deleted
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ SMOKE TEST PASSED — all wires verified 💘
```

Any non-zero exit code indicates a failure; check the printed error for details.

### How it works

1. Loads `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from `app.wrapmind/.env`.
2. Uses **service_role** as `apikey` header to bypass RLS.
3. Creates a draft invoice via `insertInvoicesOne`.
4. Updates it to `sent` via `updateInvoicesByPk`.
5. Archives it by setting `deletedAt` via same mutation.
6. Queries `invoicesCollection` with `deleted_at: { is: null }` — asserts the archived ID is absent.
7. Hard-deletes the test record as cleanup.

---

## Schema Validation (Meta-check)

You can additionally verify that the `deleted_at` column exists in production via the Supabase Management API:

```bash
export PAT=$(cat ~/.supabase/access-token)  # Admin-scoped PAT
curl -s -H "Authorization: Bearer $PAT" \
  "https://api.supabase.com/v1/projects/nbewyeoiizlsfmbqoist/query" \
  -H "Content-Type: application/json" \
  -d '{"query":"SELECT column_name, data_type FROM information_schema.columns WHERE table_name = \'invoices\' AND column_name = \'deleted_at\'"}'
```

Expected: one row with `deleted_at` of type `timestamp with time zone`.

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `organizationsCollection.edges []` | Using anon key (RLS) | Provide service_role key in `tools-tui/.env` |
| `ApolloError: Network error` | Wrong endpoint | Ensure `VITE_SUPABASE_URL` is set correctly (no trailing slash) |
| `column "deleted_at" does not exist` | Migration not applied | Deploy migration via `supabase migration up` or Management API |
| `updateInvoicesByPk returns null` | Mutation path mismatch | Verify `invoices.graphql.js` includes `deleted_at` field and `$deletedAt` var |

---

## Re-run after code changes

Whenever you modify invoice GraphQL or context, run this script before merging to ensure the archive flow stays intact.

---

**Notes**

- The script **self-cleans** by hard-deleting the test invoice. If RLS blocks hard delete, that's fine — the record will be soft-deleted and harmless.
- Test data uses fixed dates (`2026-04-28`) to keep CI reproducible.
- Do **not** run this against local Supabase; it hard-codes the production project reference.
