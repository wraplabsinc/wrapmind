---
title: PRD — Firebase Static Hosting for app.wrapmind.ai
status: active
area: devops/web
created: 2026-04-29
last_updated: 2026-04-29
owner: devops
archived: false
---

# PRD: Firebase Hosting for app.wrapmind.ai

## Overview

Deploy the WrapMind React SPA (`app.wrapmind/`) to Firebase Hosting with a custom domain (`app.wrapmind.ai`). This is a greenfield production deployment — first time connecting the frontend to live Supabase.

**Status**: In planning → active
**Target**: app.wrapmind.ai (GoDaddy domain, CNAME to Firebase)
**Branch**: `release` (protected) → automated CI/CD via GitHub Actions

---

## Goals

- Serve the Vite-built React SPA as a fully static site on Firebase Hosting
- Custom domain `app.wrapmind.ai` with HTTPS (auto-managed by Firebase)
- Automated deploys on merge to `release` branch
- Fast rollback capability (< 5 min recovery)
- Minimal initial setup; monitoring and staging added iteratively

---

## Non-Goals (Out of Scope)

- Server-side rendering (SSR) — purely static SPA
- Firebase Authentication or Firestore — app uses Supabase for auth/data
- Staging/preview environments in first phase
- Advanced security headers (CSP tightening deferred to beta audit)
- VITE_LOCAL_DEV flag removal (tracked separately)

---

## Technical Decisions

| Decision | Value |
|----------|-------|
| Hosting provider | Firebase Hosting |
| Build tool | Vite (default `vite build`) |
| Build output dir | `dist/` (Vite default) |
| Routing | SPA fallback (`index.html` for all non-file routes) |
| Caching | Standard: HTML cache 0, assets cache 1h–1d |
| HTTPS | Firebase-managed certificates |
| WWW redirect | None — `app.` is already a subdomain |
| Deploy trigger | GitHub Actions on `release` branch merge |
| Rollback (initial) | Manual Firebase CLI (`firebase hosting:rollback`) |
| Monitoring (initial) | Sentry errors only; health checks added later |

---

**Build-time (GitHub Secrets)**

Vite-prefixed (exposed to browser):
- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_ANON_KEY` — Supabase publishable anon key
- `VITE_SENTRY_DSN` — Sentry DSN for error reporting (**optional for initial launch**; leave blank if not set up yet)
- `VITE_WRAPMIND_API_URL` — **DEPRECATED**: old Express API base URL (not used after server tear-down)
- `VITE_WRAPMIND_API_KEY` — **DEPRECATED**: old API auth key (remove after Edge Functions migration)
- `VITE_APP_VERSION` — auto-injected from `package.json` (optional to set explicitly)

**Note**: `VITE_WRAPMIND_API_URL` and `VITE_WRAPMIND_API_KEY` are kept for backward compatibility but **no longer functional** — all backend calls are being migrated to Supabase Edge Functions with JWT auth (tracked in issue #126). You may leave these GitHub secrets empty for now.

**Secret storage**: GitHub repository secrets in `wraplabsinc/wrapmind` repo.

---

## Firebase Project Setup

1. Create a new Firebase project (name: `wrapmind-app`, or similar)
2. Enable **Firebase Hosting** in the project
3. Add custom domain `app.wrapmind.ai` (GoDaddy DNS)
   - Verify ownership via TXT record
   - Firebase provides CNAME target `...web.app` or `...firebaseapp.com`
   - Point GoDaddy CNAME to that target
   - Wait for DNS propagation + SSL cert issuance (usually < 1h)
4. Configure hosting site:
   - Set **public** directory to `dist`
   - Enable **SSR mode** = `none` (static only)
   - Set **SPA fallback** = rewrite all to `index.html`
   - Disable ** trailers** and **headers** for now (use defaults)

---

## GitHub Actions CI/CD

**Workflow file**: `.github/workflows/deploy.yml`

**Trigger**: Push to `release` branch

**Steps**:
1. Checkout code
2. Setup Node.js (v20+ per `package.json` engines)
3. Install dependencies: `npm ci`
4. Load env vars from GitHub secrets (all `VITE_*` and Sentry vars)
5. Build: `npm run build` → outputs `dist/`
6. Deploy using `w9jds/firebase-action@v0` with:
   - `FIREBASE_SERVICE_ACCOUNT_KEY` secret
   - Project ID from Firebase
   - `token: ${{ secrets.GITHUB_TOKEN }}`

**Protected branch**:
- `release` branch requires PR review before merge
- No direct pushes allowed

---

## Firebase Hosting Configuration (`firebase.json`)

```json
{
  "hosting": {
    "public": "dist",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**/*.@(js|css)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "public, max-age=3600, s-maxage=3600"
          }
        ]
      },
      {
        "source": "**/*.@(ico|png|svg|jpg|jpeg|gif|webp)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "public, max-age=86400, s-maxage=86400"
          }
        ]
      },
      {
        "source": "index.html",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "no-cache, no-store, must-revalidate"
          }
        ]
      }
    ]
  }
}
```

**Notes**:
- SPA fallback rewrite is mandatory (client-side router)
- HTML never cached; JS/CSS cached 1h; images/assets cached 1d
- Adjust `max-age` values as needed post-launch

---

## Security Considerations

- CSP currently includes `'unsafe-inline'` and `'unsafe-eval'` (dev mode allowances). **To be tightened before beta** (tracked in separate issue).
- All API keys in `VITE_*` vars are public-facing (client-side). Use only publishable keys.
- Supabase anon key has row-level security; ensure policies are locked down.
- Firebase service account key stored as GitHub secret — minimal `firebasehosting.admin` role only.

---

## Rollback Strategy

**Primary (initial)**: Manual rollback via Firebase CLI
```bash
firebase hosting:rollback --project <PROJECT_ID>
```
Rollback is instant (< 30 seconds) and restores the previous release.

**Recovery target**: < 5 minutes from decision to live

**SOP file**: `docs/FIREBASE_ROLLBACK_SOP.md` — step-by-step manual and future automated rollback instructions.

**Future enhancement**: GitHub Actions rollback workflow (tracked in issue #122)

---

## Monitoring & Observability

- **Errors**: Sentry (already integrated)
- **Uptime**: To be added — simple `/health` endpoint + external ping service
- **Performance**: To be added — Lighthouse audits, Core Web Vitals tracking

See issue #121 for full monitoring backlog.

---

## Pre-Launch Checklist

- [ ] Firebase project created and Hosting enabled
- [ ] Custom domain `app.wrapmind.ai` added and verified in Firebase
- [ ] GoDaddy CNAME pointed to Firebase hosting URL
- [ ] SSL certificate active (HTTPS works)
- [ ] `.env.example` updated with all required `VITE_*` vars
- [ ] GitHub secrets set:
  - [ ] `VITE_SUPABASE_URL`
  - [ ] `VITE_SUPABASE_ANON_KEY`
  - [ ] `VITE_SENTRY_DSN`
  - [ ] `VITE_WRAPMIND_API_URL`
  - [ ] `VITE_WRAPMIND_API_KEY`
  - [ ] `SENTRY_ORG`
  - [ ] `SENTRY_AUTH_TOKEN`
  - [ ] `FIREBASE_SERVICE_ACCOUNT_KEY`
- [ ] GitHub Actions workflow `.github/workflows/deploy.yml` created and tested
- [ ] `firebase.json` committed with correct `public: "dist"` and SPA rewrite
- [ ] First deploy to Firebase succeeds (`release` branch → production)
- [ ] Homepage loads at `https://app.wrapmind.ai`
- [ ] Supabase auth flow works (login/logout)
- [ ] No critical console errors on initial load
- [ ] `/health` endpoint returns 200 (if implemented pre-launch; otherwise post-launch)
- [ ] Sentry receives test error (verify integration)
- [ ] Rollback SOP (`docs/FIREBASE_ROLLBACK_SOP.md`) written and verified
- [ ] PRD archived (moved to `/docs` and `archived: true` set above)

---

## Open Questions / Future Work

- [ ] Implement automated smoke tests (post-launch)
- [ ] CSP tightening before beta
- [ ] Staging environment for feature/hotfix branches
- [ ] Automated rollback via GitHub Actions — issue [#122](https://github.com/wraplabsinc/wrapmind/issues/122)
- [ ] Add `/health` endpoint and uptime monitoring — issue [#121](https://github.com/wraplabsinc/wrapmind/issues/121)
- [ ] Performance monitoring (Core Web Vitals)
- [ ] Security audit (pre-beta)
- [x] Remove `VITE_LOCAL_DEV` flag — issue [#124](https://github.com/wraplabsinc/wrapmind/issues/124)
- [ ] Migrate from Express API to Supabase Edge Functions — issue [#126](https://github.com/wraplabsinc/wrapmind/issues/126)
- [ ] Set up Sentry DSN and build integration — issue [#127](https://github.com/wraplabsinc/wrapmind/issues/127)

---

## GitHub Issue Tracking

| Task | Issue |
|------|-------|
| Monitoring (health, uptime, performance) | [#121](https://github.com/wraplabsinc/wrapmind/issues/121) |
| Automated Firebase rollback workflow | [#122](https://github.com/wraplabsinc/wrapmind/issues/122) |
| Firebase service account setup for CI | [#123](https://github.com/wraplabsinc/wrapmind/issues/123) |
| Remove `VITE_LOCAL_DEV` flag | [#124](https://github.com/wraplabsinc/wrapmind/issues/124) |
| Migrate from Express API to Supabase Edge Functions | [#126](https://github.com/wraplabsinc/wrapmind/issues/126) |
| Set up Sentry DSN | [#127](https://github.com/wraplabsinc/wrapmind/issues/127) |
| CSP security tightening (pre-beta) | *(to be created)* |

---

## Related Documents

- **SOP**: `docs/FIREBASE_ROLLBACK_SOP.md`
- **Env template**: `app.wrapmind/.env.example`
- **Build config**: `app.wrapmind/package.json`, `app.wrapmind/vite.config.js`
- **Monitoring issue**: https://github.com/wraplabsinc/wrapmind/issues/121
- **Rollback automation issue**: https://github.com/wraplabsinc/wrapmind/issues/122
- **Service account issue**: https://github.com/wraplabsinc/wrapmind/issues/123

---

## Acceptance Criteria

1. `https://app.wrapmind.ai` serves the built React SPA with no errors
2. User can log in via Supabase Auth (minimum viable)
3. CI/CD pipeline automatically deploys `release` → Firebase
4. Rollback can be executed manually in < 5 minutes
5. Basic error monitoring active (Sentry)
6. PRD completed and archived

---

## Revision History

| Date | Changes |
|------|---------|
| 2026-04-29 | Initial draft — all questions gathered, issues created |
