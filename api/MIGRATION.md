# Migration: Express Auth + Data Layer → Supabase Native

This document describes the migration from the Express-based JWT auth system (Express holds the JWT signing key and bypasses RLS) to native Supabase Auth with Row Level Security.

## What Changed

### Before
```
React App  →  Express (JWT + bcrypt, service role bypasses RLS)  →  Supabase
```

### After
```
React App  →  Supabase Auth (email/password sessions)  →  Supabase (RLS enforced)
                        ↓
              Edge Functions preserve /api/* for n8n/external callers
```

### New Files

#### wrapos-data (Express server)
| File | Change |
|------|--------|
| `supabase/migrations/20250411190000_supabase_auth_migration.sql` | **NEW** — RLS policies, auth linking, helper functions, pending-user trigger |
| `supabase/migrations/20250411190001_backfill_existing_users.sql` | **NEW** — one-time link for existing users |
| `supabase/functions/api-invite/index.ts` | **NEW** — generates 7-day magic invite links |
| `supabase/functions/api-auth/index.ts` | **NEW** — preserves `/api/auth/*` for external callers |
| `supabase/functions/api-estimates/index.ts` | **NEW** — preserves `/api/estimates/*` for external callers |
| `supabase/functions/api-clients/index.ts` | **NEW** — preserves `/api/clients/*` for external callers |
| `supabase/functions/api-leads/index.ts` | **NEW** — preserves `/api/intake/*` for external callers |

#### wrapos-apps (React app)
| File | Change |
|------|--------|
| `src/lib/supabase.js` | Updated to use env vars |
| `src/context/AuthContext.jsx` | Wraps Supabase auth + profile fetching, calls api-invite Edge Function |
| `src/pages/LoginPage.jsx` | Real Supabase email/password login |
| `src/context/RolesContext.jsx` | Syncs role from profile |
| `src/components/InviteUserModal.jsx` | **NEW** — owner generates magic invite links |
| `src/components/Settings.jsx` | **PATCHED** — wired Invite User modal |
| `.env.example` | Documents required env vars |

---

## Step-by-Step Migration

### Step 1: Run the SQL Migrations (in order)

Go to **Supabase Dashboard → SQL Editor** and run these two files in order:

**1a.** `supabase/migrations/20250411190000_supabase_auth_migration.sql`
- Adds `auth_user_id` + `status` to `users`
- Adds RLS policies to all tables
- Creates `get_user_org_id()` and `get_current_user_profile()` helpers
- Creates `create_pending_user()` RPC
- Creates `link_pending_user()` trigger (fires when a new user confirms their email)

**1b.** `supabase/migrations/20250411190001_backfill_existing_users.sql`
- Run this **after** all existing users have logged in and reset their password
- Links existing `users` rows to their new `auth.users` accounts by email

### Step 2: Enable Supabase Email Auth

In **Supabase Dashboard → Authentication → Providers → Email**:
1. Enable **Email/Password**
2. Set "Confirm email" = OFF for dev, ON for production
3. Set Site URL to your app URL

### Step 3: Configure Redirect URLs

In **Supabase Dashboard → Authentication → URL Configuration**:
Add to **Redirect URLs**:
- `http://localhost:5173` (dev)
- Your production URL

### Step 4: Deploy Edge Functions

```bash
cd wrapos-data
supabase login
supabase link --project-ref nbewyeoiizlsfmbqoist
supabase functions deploy api-auth
supabase functions deploy api-invite
supabase functions deploy api-estimates
supabase functions deploy api-clients
supabase functions deploy api-leads
```

Set the secrets for each function:
```bash
supabase secrets set SUPABASE_URL=https://nbewyeoiizlsfmbqoist.supabase.co
supabase secrets set SUPABASE_ANON_KEY=<your-anon-key>
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
supabase secrets set SITE_URL=https://your-app-url.com
```

### Step 5: Configure GitHub Secrets

In your GitHub repo, add these secrets:
```
VITE_SUPABASE_URL=https://nbewyeoiizlsfmbqoist.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

### Step 6: Create the First Owner Account

**Option A — Via Supabase Dashboard (recommended for first user):**
1. Go to **Authentication → Users → Add user**
2. Create a user with your email and a password
3. Note the `auth.users` UUID

Then in the SQL editor:
```sql
UPDATE users
SET auth_user_id = '<auth-user-uuid>',
    status = 'active'
WHERE email = 'your@email.com';
```

**Option B — Via Invite Flow:**
1. Build and run the React app
2. Sign up as a new user (Supabase handles this via the login page)
3. In the SQL editor, link the new auth user to the existing users row by email

### Step 7: Backfill Existing Users

Once all existing users have logged in at least once (they'll use "Forgot Password" to set their Supabase password):

Run `supabase/migrations/20250411190001_backfill_existing_users.sql` in the SQL Editor.

This will:
- Link users that have a matching `auth.users` account → set to `active`
- Mark users with no `auth.users` match → set to `orphaned` (they need to use "Forgot Password")

---

## Inviting New Users

Owners invite team members from **Settings → Users → Invite User**.

1. Owner fills in email, first name, last name, and role
2. Clicks "Generate Invite Link"
3. A 7-day magic link is returned and displayed
4. Owner copies and shares the link
5. New user opens the link → sets their password → their account is auto-linked

---

## API Routes Preserved (for external callers)

External callers (n8n, webhooks, etc.) that can't use Supabase directly call these Edge Functions:

```
POST   /api/auth/login         → api-auth
POST   /api/auth/logout        → api-auth
GET    /api/auth/me            → api-auth

GET    /api/estimates           → api-estimates
POST   /api/estimates           → api-estimates
GET    /api/estimates/:id      → api-estimates
PATCH  /api/estimates/:id      → api-estimates
DELETE /api/estimates/:id      → api-estimates
POST   /api/estimates/:id/approve  → api-estimates
GET    /api/estimates/:id/notes    → api-estimates
POST   /api/estimates/:id/notes    → api-estimates

GET    /api/clients            → api-clients
POST   /api/clients            → api-clients
GET    /api/clients/:id        → api-clients
PATCH  /api/clients/:id        → api-clients

POST   /api/intake             → api-leads (public, no auth)
GET    /api/intake/leads       → api-leads
GET    /api/intake/leads/:id   → api-leads
POST   /api/intake/leads/:id/convert  → api-leads
PATCH  /api/intake/leads/:id/status   → api-leads

POST   /api-invite             → api-invite (auth required, owner only)
```

---

## Role Mapping

| `users.role` | App Role | Icon |
|---|---|---|
| `owner` | Owner (full access) | 👑 |
| `manager` | Manager | 📋 |
| `writer` | Service Writer | 👤 |

---

## RLS: How Org Isolation Works

Every query goes through Supabase with the user's JWT. RLS policies use `get_user_org_id()`:

```sql
CREATE OR REPLACE FUNCTION get_user_org_id()
RETURNS UUID AS $$
  SELECT org_id FROM users WHERE auth_user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;
```

All table policies check `org_id = get_user_org_id()`. Cross-org access is structurally impossible.

---

## Removing the Express Server

Once all external callers are migrated to Edge Functions and the React app is stable:

1. Remove the `auth` routes from Express (`/api/auth/login`, `/api/auth/me`)
2. Remove `bcrypt`, `jsonwebtoken` dependencies
3. Stop the Express server
4. Archive or delete the `wrapos-data` repo

The Express server is no longer needed for the React app to function.
