# PRD: WrapOS Data API — Bare Essentials Test

## Context

Issue [#79](https://github.com/wraplabsinc/wrapos-data/issues/79)

The WrapIQ API (wrapos-data) is a critical connector between ShopMonkey and Supabase. Before doing further development or deployment work, we need to verify the API starts cleanly, routes respond correctly, and external integrations (Supabase, ShopMonkey, Twilio, SendGrid, etc.) are wired properly.

## Goal

Establish a minimal working API that can be built upon incrementally — one route at a time — with a clear record of what works and what doesn't.

## Current Route Inventory

All routes live in `src/routes/index.js` and are mounted under `/api`:

| Route | Purpose | External Dependencies |
|-------|---------|----------------------|
| `/auth` | Authentication (JWT, bcrypt) | Supabase |
| `/estimates` | Estimate CRUD | Supabase |
| `/clients` | Client management | Supabase |
| `/settings` | App settings | Supabase |
| `/film` | Film type/price calculations | None |
| `/vision` | AI vision analysis | OpenAI Anthropic |
| `/ai` | AI estimate generation | OpenAI Anthropic |
| `/intake` | Vehicle intake form | Supabase |
| `/upsells` | Upsell logic | Supabase |
| `/search` | Full-text search | Supabase |
| `/vin` | VIN decoding | External VIN API |
| `/export` | PDF/CSV export | pdfkit |

## Strategy

### Phase 1: Minimal Viable Start (Bare Bones)

1. Comment out ALL routes in `src/routes/index.js`
2. Keep only:
   - `app.get('/health')` — basic health check
   - `app.get('/api/health')` — JSON health with version
3. Verify the server starts cleanly with `npm start`
4. Verify both health endpoints respond

### Phase 2: Enable Routes One by One

For each route (in dependency order):

1. Uncomment ONE route in `src/routes/index.js`
2. Run `npm start` and check for startup errors
3. Hit the route's key endpoints manually or via test
4. Document what works / what's broken
5. If broken, decide: fix it now or leave commented and note the issue

**Route enable order** (least dependent → most dependent):

1. `/film` — pure calculation, no external deps
2. `/vin` — only external VIN API
3. `/estimates` — core data, Supabase
4. `/clients` — core data, Supabase
5. `/settings` — config, Supabase
6. `/intake` — form data, Supabase
7. `/upsells` — business logic, Supabase
8. `/search` — full-text, Supabase
9. `/export` — PDF generation, no new external deps
10. `/auth` — JWT/bcrypt, Supabase
11. `/vision` — AI vision, OpenAI
12. `/ai` — AI generation, OpenAI

### Phase 3: Document Findings

For each route, record:
- ✅ Route enabled and working
- ⚠️ Route enabled but with warnings/issues
- ❌ Route causes startup failure (reason)
- 📝 Notes / things to fix

## Deliverables

1. **`src/routes/index.js`** — routes commented/uncommented per findings
2. **`PHASE2_TESTING.md`** — route-by-route test notes (created in repo docs/)
3. **Git commit per phase** — clean, atomic commits for each phase

## Exit Criteria

- API starts with at least health endpoints working
- All 12 route groups have been tested and documented
- Any broken routes are identified with clear error notes
- Phase 3 doc reflects current state of the codebase
