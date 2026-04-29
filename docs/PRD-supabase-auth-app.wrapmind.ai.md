# PRD: Supabase Client-Side Auth for app.wrapmind.ai

_Static SPA with full authentication system. Supabase as the auth provider._

## 1. Overview & OKR

**Objective**: Add complete client-side authentication to `app.wrapmind.ai` using Supabase Auth, with role-based access control (RBAC) and a polished user experience.

**Why**: Users and shop owners need secure login/logout, password management, and role-based data access before they can use the core features (estimates, invoices, etc.).

**Scope**: Authentication layer only — does not include new product features. Focus on sign-in, sign-up, session management, password reset, OAuth, and RBAC wiring.

**Release**: Alpha → public launch contingent on successful auth integration and smoke tests. Does not delay static hosting launch; can be deployed incrementally.

**Tied Issues**: Tracked across GitHub issues (see §8).

---

## 2. Current State (As-Is)

| Area | Status |
|------|--------|
| **Frontend codebase** | React SPA (`app.wrapmind/`) with Vite |
| **Auth backend** | Supabase Auth (nbewyeoiizlsfmbqoist) — users exist in dashboard |
| **Auth UI** | `AuthPage.jsx` exists with login and signup forms (email + password only) |
| **Auth context** | `AuthContext.jsx` implemented — provides `user`, `profile`, `org`, `signIn`, `signOut`, `signUp` |
| **Route guarding** | All routes protected in `App.jsx` — renders `AuthPage` if `!isAuthenticated` |
| **Session** | Supabase JS SDK configured (`supabase.js`) with `autoRefreshToken: true`, `persistSession: true` |
| **Dev mode** | `VITE_LOCAL_DEV=1` bypasses Supabase with hard-coded dev user |
| **Missing** | Magic link, OAuth (Google/GitHub), password reset, email/password update, "Remember me", RBAC enforcement, audit log hooks |

---

## 3. User Roles & Access (RBAC)

### Role Hierarchy

| Role | Description | Can Create | Can Edit | Org/Location Scope |
|------|-------------|------------|----------|---------------------|
| **Super Admin (wrapmind employee)** | Full system access across all orgs/locations | Anything | Anything | All orgs & locations |
| **Org Owner** | Manages their organization | Employees & contractors | Employees & contractors within their org | Their org only |
| **Location Owner** | Manages their shop location | Employees & contractors | Employees & contractors within their location | Their location only |
| **Estimator (default)** | Regular user — can use the app | — | — | Their assigned location |

**Implementation notes**:
- User roles come from `profiles.role` field (likely `owner`, `estimator`, etc.)
- Org/location assignment from `profiles.org_id` and `profiles.location_id` (verify in DB schema)
- RBAC checks added to: API routes (Edge Functions), UI visibility (conditionally render buttons/tabs), data mutations

---

## 4. Detailed Requirements

### 4.1 Authentication Methods

1. **Email + Password** — already implemented in `AuthContext.signIn()` and `AuthContext.signUp()`
2. **Magic Link** — user enters email → Supabase sends login link → one-click sign-in
3. **OAuth** — Google and GitHub buttons on the auth page
4. **Password Reset** — "Forgot password?" page → email reset link
5. **Email/Password Update** — settings page to change credentials (requires re-auth)

### 4.2 Session Management

- Session lives across browser tabs via `localStorage` (Supabase default)
- Access token: 1 hour (Supabase default)
- Refresh token: 7 days of inactivity (Supabase default)
- Automatic refresh handled by SDK (seamless to user)
- "Remember me" checkbox: checked → `localStorage`; unchecked → `sessionStorage` (cleared on tab close)

### 4.3 Password Flow

- Sign-up: min 8 characters, no complexity rules
- Sign-in: standard email + password
- Forgot password: dedicated page → reset link sent via email
- Change password: requires current password confirmation
- Supabase setting: require re-auth before email/password change — **ENABLED**

### 4.4 Error & Load States

- **Inline form errors** — displayed under the relevant field or at form top (existing pattern in `AuthPage`)
- **Loading spinners** — shown while network requests are in-flight (button disable + text "Please wait...")
- **Global error boundary** — existing Sentry integration captures unexpected auth errors

### 4.5 Post-Auth Behavior

- On successful login: redirect to main app (router navigates to `/`)
- Logout: clears session, redirects to login automatically via route guard
- Token expiry while active: silent refresh; if refresh fails, redirect to login
- Concurrent sessions: allowed — user can log in on multiple devices simultaneously

### 4.6 UI Pages Required

| Page | Purpose | Status |
|------|---------|--------|
| **Login / Signup** | Unified page with tab switching | ✅ exists |
| **Forgot Password** | Request reset link | ❌ new |
| **Reset Password** | Set new password from email link | implicit in Supabase |
| **Settings → Security** | Change email/password, logout other sessions | ❌ new |

### 4.7 Security & Audit

- All auth events logged via existing `AuditLogContext` (sign-in, sign-out, password change, role change)
- No rate limiting on login yet (monitor for abuse later)
- No suspicious IP detection yet
- Admin-only account deletion (via Supabase dashboard or future admin panel)

---

## 5. Implementation Plan (Phased)

### Phase 1 — Core Auth Completion (Week 1)

**Goal**: Add missing auth features so users can fully manage their accounts.

**Tasks**:

1. **Magic Link Sign-In**
   - Add "Sign in with email link" button to `AuthPage`
   - Call `supabase.auth.signInWithOtp({ email, options: { emailRedirectTo } })`
   - Show confirmation UI: "Check your email for a magic link"
   - Handle callback in `App.jsx` (already covered by `detectSessionInUrl: true`)
   
2. **OAuth (Google + GitHub)**
   - Add OAuth provider buttons to `AuthPage`
   - For Google: `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } })`
   - For GitHub: same with `provider: 'github'`
   - Configure OAuth apps in Supabase dashboard first (provider credentials)
   - Handle new user metadata: `provider` field saved by Supabase, but also set role to `estimator` on first login

3. **Forgot Password Flow**
   - Create `ForgotPasswordPage.jsx` component
   - Email input → `supabase.auth.resetPasswordForEmail(email, { redirectTo: 'https://app.wrapmind.ai/update-password' })`
   - Confirmation UI: "Reset link sent"
   - Route: `/forgot-password`

4. **Password Update in Settings**
   - Add "Security" section to user settings (if not present)
   - Fields: current password, new password, confirm new password
   - Call `supabase.auth.updateUser({ password: newPassword })` (requires re-auth by default)

5. **Remember Me Persistence**
   - In `AuthPage`, add "Remember me" checkbox
   - When submitting login/signup: temporarily change `supabase.auth.persistSession` based on checkbox
   - For `sessionStorage` mode: clear Supabase auth on logout + also clear manually
   - Supabase JS SDK stores session in `localStorage` by default; to use `sessionStorage` we need custom storage adapter (advanced). **Simplified approach**: keep localStorage always; checkbox is informational only (no behavior change) — or skip checkbox if too complex. **Decision path**:
     - Option A (simpler): checkbox removable (skip) — session lasts 7 days with auto-refresh
     - Option B (proper): conditionally reconfigure Supabase client at login time (requires custom storage adapter or client recreation)

   **Recommended**: Start with Option A; add checkbox later if needed. Avoid complexity.

### Phase 2 — RBAC Enforcement (Week 1–2)

**Goal**: Ensure users only see/modify data within their org/location scope.

**Tasks**:

1. **Backend (Edge Functions)**
   - Every secure endpoint reads `request.auth` (Supabase JWT)
   - Extract user ID, profile role, org_id, location_id from JWT claims (add these claims to token via Supabase auth hooks or custom claims)
   - If user is Super Admin: bypass scope checks
   - If user is Org Owner: filter data to `org_id = X`
   - If user is Location Owner: filter data to `location_id = X`
   - Return 403 if user attempts access outside scope

2. **Frontend UI**
   - In components that list orgs/locations, filter to user's accessible set based on `profile.role`
   - Hide "Create Organization" button for non-Super Admins
   - Settings pages only show relevant org/location selection
   - Disable actions (edit/delete) if user doesn't own that org/location

3. **Context Enrichment**
   - Extend `AuthContext` to load `location` alongside `org`
   - Add helper: `canEdit(orgId, locationId)` that returns boolean based on `role`

4. **Audit Log**
   - Hook into existing `AuditLogContext` to log role changes, org transfers, sensitive data access

### Phase 3 — Polish & DevEx (Week 2)

**Goal**: Improve developer experience and robust error handling.

**Tasks**:

- Add Sentry breadcrumbs for auth events (sign-in, sign-out, password change)
- Show inline help on auth errors (e.g., "Confirm your email first" if account not confirmed)
- "Resend confirmation email" button for pending sign-up
- Test OAuth flows locally (ngrok tunnel for callback URLs during dev)
- Update Supabase secrets in production to include OAuth client IDs/secrets (already done? verify)

### Phase 4 — Monitoring & Observability (Week 3)

**Goal**: Track auth health and catch problems early.

**Tasks**:

- Add custom Sentry events for auth failures (with `user_id` but not password)
- Dashboard: daily active users (DAU), new sign-ups, failed login attempts
- Alert on unusual spike in failed logins (Sentry alerts)

---

## 6. Acceptance Criteria

By the end of Phase 1, the following must work **in production**:

- [ ] User can sign up with email/password → receives confirmation (if email verification later enabled) OR is immediately logged in (no email confirm required per spec)
- [ ] User can sign in with email/password → redirected to main app
- [ ] User can sign in via magic link → one-click login from email
- [ ] User can sign in via Google/GitHub OAuth → redirected back, logged in
- [ ] "Forgot password?" page accessible from login screen
- [ ] Reset email sent → user can set new password via link
- [ ] Authenticated user can change their email/password in settings (requires re-auth)
- [ ] Logout clears session and returns to login page
- [ ] Session persists across browser tabs (verified by opening app in two tabs)
- [ ] 1 hour of inactivity triggers token refresh (silently) with no user interruption
- [ ] Refresh token expires after 7 days of inactivity → user re-logs in smoothly
- [ ] RBAC: User with `role: 'estimator'` cannot access org management screens
- [ ] RBAC: Org owner can only see their org/locations in dropdowns
- [ ] Super Admin sees all orgs/locations and has full access
- [ ] All auth events (sign in/out, password change, role change) are logged via `AuditLogContext`
- [ ] No secrets committed to git — `.env*` still ignored
- [ ] Sentry captures auth errors without PII leakage

By the end of Phase 2:

- [ ] All Edge Functions enforce RBAC claims from JWT
- [ ] Supabase JWT includes custom claims: `role`, `org_id`, `location_id` (verify via auth hook or custom token)
- [ ] Frontend UI respects RBAC for all data fetching and mutations

---

## 7. Technical Implementation Details

### Supabase Auth Configuration (Production)

In Supabase dashboard → Auth → Settings:

- **Enable email confirmations**: OFF (per spec "no verification needed")
- **Secure email change**: ON (require re-confirmation)
- **Allow OAuth**: Google, GitHub (provide callback URLs: `https://app.wrapmind.ai/auth/callback`)
- **Rate limits**: Default (optional: increase for beta)

**JWT Custom Claims** (to carry RBAC data):
- Option A: **Auth Hook** (`supabase/functions/auth-hook`) — on sign-in, enrich JWT with `role`, `org_id`, `location_id` from `profiles` table
- Option B: **PostgREST** — read `profiles` directly in Edge Functions (slower but simpler)
- **Recommendation**: Start with Option B (simpler), migrate to Option A if performance/multiple reads become an issue.

**Database Triggers**: Ensure `profiles` row created on first sign-up via trigger (existing? verify). `AuthContext.ensureProfile()` handles fallback but DB trigger is safer.

### Frontend Code Changes

**New files**:
- `app.wrapmind/src/components/auth/ForgotPasswordPage.jsx`
- `app.wrapmind/src/components/settings/SecuritySettings.jsx` (or extend existing Settings)

**Modified files**:
- `app.wrapmind/src/components/auth/AuthPage.jsx` — add magic link + OAuth buttons
- `app.wrapmind/src/context/AuthContext.jsx` — add methods: `signInWithOAuth`, `signInWithMagicLink`, `updateEmail`, `updatePassword`, `resetPassword`
- `app.wrapmind/src/lib/supabase.js` — no changes needed (already configured)
- `app.wrapmind/src/App.jsx` — add route `/forgot-password` and `/update-password` (if standalone pages)

**RBAC helpers**:
- `app.wrapmind/src/lib/rbac.js` — functions: `canAccessOrg(userRole, targetOrgId)`, `canAccessLocation(userRole, targetLocationId)`, `isSuperAdmin(role)`

### Remember Me Implementation

**Option A (minimal)**: Skip checkbox — always use localStorage (7-day refresh token lifecycle). Simpler, fewer edge cases.

**Option B (proper)**: 
1. On login, if "Remember me" unchecked, call `supabase.auth.setSession({ access_token, refresh_token })` with storage override (not directly supported by SDK)
2. Custom storage adapter required — complex for MVP.
**Decision**: Start with Option A. Add checkbox later as a minor enhancement if users request it.

---

## 8. Tracking Issues (GitHub)

| # | Title | Phase | Status |
|---|-------|-------|--------|
| auth-1 | Implement magic link sign-in (OTP) | Phase 1 | ☐ |
| auth-2 | Add OAuth (Google + GitHub) to auth page | Phase 1 | ☐ |
| auth-3 | Create "Forgot password" page with reset flow | Phase 1 | ☐ |
| auth-4 | Settings page: change email & password (re-auth required) | Phase 1 | ☐ |
| auth-5 | Add custom claims (role/org/location) to Supabase JWT via auth hook | Phase 2 | ☐ |
| auth-6 | Enforce RBAC in all Edge Functions | Phase 2 | ☐ |
| auth-7 | Frontend RBAC UI gating (hide/disable unauthorized actions) | Phase 2 | ☐ |
| auth-8 | Add auth event logging to AuditLogContext | Phase 1 | ☐ |
| auth-9 | Sentry breadcrumbs for auth events | Phase 3 | ☐ |
| auth-10 | OAuth callback route handling & confirmation UI | Phase 1 | ☐ |

---

## 9. Risks & Open Questions

| Risk | Mitigation |
|------|------------|
| OAuth callback URL misconfigured in Supabase | Double-check production URL; use ngrok for local testing |
| Magic link emails going to spam | Configure Supabase email templates (branding) |
| JWT size exceeds header limit when adding custom claims | Keep claims minimal (UUIDs only) |
| Concurrent session revocation not real-time | Acceptable for now; future: implement `supabase.auth.signOut()` globally on password change |
| "Remember me" complexity | Start without checkbox; add later if requested |

**Open Questions**:
1. Do we need email verification _ever_? (Spec says "no" for now — can enable later)
2. Should org/location assignment happen at sign-up, or later by admin? (Currently: default org created; later admin reassigns)
3. Should magic link login require the user to already exist, or create-on-first-use? (Supabase default: create if new; we may want admin approval flow later)

---

## 10. Success Metrics

- Authentication flow completion rate > 90%
- Mean time to sign in < 2 seconds
- Zero PII leaks in logs (verified via Sentry sampling)
- Password reset success > 95% (email deliverability)
- OAuth conversion rate tracked via Google Analytics

---

## 11. Rollout & Rollback

**Rollout**:
- Deploy auth features behind a `?beta` feature flag initially
- Enable to 10% of users via `FeatureFlagsContext`
- Once smoke-tested on internal accounts, enable 100%

**Rollback**:
- If OAuth breaks login, disable OAuth buttons via feature flag
- If magic link fails, fall back to email+password still works
- Full rollback not needed — core login remains stable

---

## 12. Appendix

### A. Supabase Auth Methods Reference

```javascript
// Email + magic link
supabase.auth.signInWithOtp({ email })

// OAuth
supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } })

// Sign out
supabase.auth.signOut()

// Update password
supabase.auth.updateUser({ password: 'newPass' })

// Reset password email
supabase.auth.resetPasswordForEmail(email, { redirectTo: 'https://app.wrapmind.ai/update-password' })
```

### B. Environment Variables Required

| Variable | Purpose | Required? |
|----------|---------|-----------|
| `VITE_SUPABASE_URL` | Supabase project URL | Yes |
| `VITE_SUPABASE_ANON_KEY` | Public anon key | Yes |
| `VITE_LOCAL_DEV` | Bypass auth in dev | Optional (dev only) |
| `VITE_SENTRY_DSN` | Error tracking | Yes (currently blank) |

---

**PRD Author**: Hermes (AI Agent)  
**Last Updated**: 2026-04-29  
**Status**: Draft — awaiting validation with user
