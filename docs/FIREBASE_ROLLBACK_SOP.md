# Firebase Hosting Rollback SOP

**App**: app.wrapmind.ai  
**Project**: WrapMind (Firebase project ID: `wrapmind-app` or similar)  
**Owner**: DevOps / on-call engineer  
**Last updated**: 2026-04-29

---

## Purpose

This SOP provides step-by-step instructions to roll back a Firebase Hosting release for `app.wrapmind.ai` in case of a bad deployment. Target recovery time: **< 5 minutes**.

---

## When to Use

- Critical bug introduced in latest release (auth broken, JS errors, CSS broken)
- Performance regression causing UI unusability
- Security issue requiring immediate revert
- Any situation where redeploying a fix would take longer than rolling back

**Do NOT use** for minor cosmetic issues — just fix and redeploy normally.

---

## Prerequisites

- Firebase CLI installed (`npm install -g firebase-tools`)
- Access to the Firebase project (Editor or Owner role)
- `FIREBASE_SERVICE_ACCOUNT_KEY` JSON available (for CI/CD; not needed for manual CLI)
- GitHub repository access (for triggering automated rollback once implemented)

---

## Method 1 — Manual Rollback (Current)

**Rollback is instant** — Firebase Hosting keeps the previous release and swaps traffic back in < 30 seconds.

### Step-by-step

1. **Authenticate** (if not already):
   ```bash
   firebase login
   ```
   Or use service account:
   ```bash
   export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
   ```

2. **Verify current release** (optional, see what's live):
   ```bash
   firebase hosting:releases:list --project <PROJECT_ID>
   ```
   Output shows version IDs, timestamps, and which is LIVE.

3. **Execute rollback**:
   ```bash
   firebase hosting:rollback --project <PROJECT_ID>
   ```
   You'll be prompted: "Rollback to previous version? (y/N)" — type `y`.

4. **Confirm rollback**:
   ```bash
   firebase hosting:releases:list --project <PROJECT_ID>
   ```
   The previous version should now have `LIVE` status.

5. **Verify the site**:
   - Open `https://app.wrapmind.ai` in browser (hard refresh: Ctrl+Shift+R)
   - Check console for errors
   - Test critical flow (login, create estimate)
   - Confirm issue resolved

6. **Communicate**:
   - Post in #wrapmind-ops or team channel: "Rollback complete — version <SHA> restored"
   - Link to the deployment/rollback issue if applicable
   - Document root cause in post-mortem (if needed)

---

## Method 2 — Automated Rollback (Future)

Once issue #122 is implemented, you'll be able to trigger rollback via GitHub Actions:

### Option A: Issue Comment Trigger
- Navigate to the deployment issue (e.g., the PR that introduced the bad release)
- Comment `/rollback` on the issue
- GitHub Actions workflow will:
  - Call Firebase Management API to roll back the latest release
  - Post status update in the issue thread
  - Tag on-call engineer if rollback fails

### Option B: Manual Workflow Dispatch
- Go to GitHub Actions tab → workflow `Rollback Firebase Hosting`
- Click "Run workflow"
- Select `production` environment, confirm
- Workflow executes rollback and reports status

---

## Rollback Window & Monitoring

- **Immediate**: Firebase rollback is instantaneous; no propagation delay
- **CDN cache**: Firebase invalidates cache on rollback automatically
- **Monitoring**: Watch Sentry error rates and `/health` endpoint (once added) after rollback to confirm resolution

---

## Post-Rollback Actions

1. **Fix the issue** in a feature branch (do NOT merge directly to `release`)
2. **Test locally** with production env vars (use `.env.local` override)
3. **Open a PR** with the fix, link to rollback incident
4. **Deploy** via normal CI/CD once PR merges to `release`
5. **Update SOP** if rollback revealed any process gaps

---

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---------|--------------|-----|
| `permission-denied` | Service account lacks `firebasehosting.admin` role | Grant role in Google Cloud IAM |
| `no previous release to roll back to` | First deployment or already rolled back | No-op — nothing to do; just redeploy a fixed build |
| Rollback succeeds but site still broken | Issue is not the release (e.g., Supabase outage) | Check Supabase status; may need feature flag toggle or config change |
| CLI command not found | Firebase CLI not installed | `npm install -g firebase-tools` |

---

## Appendix: Firebase Project Details

- **Project name**: WrapMind App (TBD)
- **Firebase project ID**: `XXXXX` (fill in when created)
- **Hosting site ID**: `app.wrapmind.ai`
- **Service account email**: `firebase-administrator@XXXXX.iam.gserviceaccount.com`
- **Required IAM role**: `Firebase Hosting Admin` (`roles/firebasehosting.admin`)

---

## SOP Ownership

- **Primary owner**: DevOps team / lead engineer
- **Secondary**: Any maintainer with Firebase access
- **Review cadence**: Quarterly, or after any rollback event
