# GitHub Secret Setup Tasks

## Repository Secrets (Already Configured)
- [x] `GCP_PROJECT_ID` = `wrapmind`
- [x] `GCP_WORKLOAD_IDENTITY_PROVIDER` = `projects/337169955487/locations/global/workloadIdentityPools/github-pool/providers/github-provider`
- [x] `GCP_SERVICE_ACCOUNT_EMAIL` = `github-actions-deployer@wrapmind.iam.gserviceaccount.com`
- [x] `GCP_REGION` = `us-west-2`
- [x] `STAGING_SERVICE_NAME` = `wrapmind-data-staging`
- [x] `PRODUCTION_SERVICE_NAME` = `wrapmind-data-prod`

## Repository Variables (Already Configured)
- [x] `ANTHROPIC_MODEL` = `claude-sonnet-4-20250514`
- [x] `ESTIMATE_PREFIX` = `WL`
- [x] `FRONTEND_URL` = `https://your-frontend.com`
- [x] `PORT` = `3001`
- [x] `NODE_ENV` = `production`

## Environments (Already Created)
- [x] `staging` environment
- [x] `production` environment

---

## Secrets Requiring Real Values

### Staging Environment Secrets
Update these via: https://github.com/wraplabsinc/wrapos-data/settings/environments/staging

| Secret Name | Status |
|-------------|--------|
| `SUPABASE_URL` | Placeholder - needs real value |
| `SUPABASE_ANON_KEY` | Placeholder - needs real value |
| `SUPABASE_SERVICE_ROLE_KEY` | Placeholder - needs real value |
| `JWT_SECRET` | Placeholder - needs real value |
| `ANTHROPIC_API_KEY` | Placeholder - needs real value |
| `TWILIO_ACCOUNT_SID` | Placeholder - needs real value |
| `TWILIO_AUTH_TOKEN` | Placeholder - needs real value |
| `TWILIO_FROM_NUMBER` | Placeholder - needs real value |
| `SENDGRID_API_KEY` | Placeholder - needs real value |
| `SLACK_WEBHOOK_URL` | Placeholder - needs real value |

### Production Environment Secrets
Update these via: https://github.com/wraplabsinc/wrapos-data/settings/environments/production

| Secret Name | Status |
|-------------|--------|
| `SUPABASE_URL` | Placeholder - needs real value |
| `SUPABASE_ANON_KEY` | Placeholder - needs real value |
| `SUPABASE_SERVICE_ROLE_KEY` | Placeholder - needs real value |
| `JWT_SECRET` | Placeholder - needs real value |
| `ANTHROPIC_API_KEY` | Placeholder - needs real value |
| `TWILIO_ACCOUNT_SID` | Placeholder - needs real value |
| `TWILIO_AUTH_TOKEN` | Placeholder - needs real value |
| `TWILIO_FROM_NUMBER` | Placeholder - needs real value |
| `SENDGRID_API_KEY` | Placeholder - needs real value |
| `SLACK_WEBHOOK_URL` | Placeholder - needs real value |

---

## Next Steps
1. Update all placeholder secrets with real values in GitHub UI
2. Run workflow manually: https://github.com/wraplabsinc/wrapos-data/actions/workflows/deploy.yml
