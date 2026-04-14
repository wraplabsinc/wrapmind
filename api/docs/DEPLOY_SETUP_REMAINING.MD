# GitHub Deploy Setup - Remaining Steps

## GCP Setup: COMPLETE

All APIs enabled, service account created, Workload Identity configured.

---

## 1. GitHub Secrets (Repository Level)

Go to: `https://github.com/wraplabsinc/wrapos-data/settings/secrets/actions`

Add these **Repository secrets**:

| Secret Name | Value |
|-------------|-------|
| `GCP_PROJECT_ID` | `wrapmind` |
| `GCP_WORKLOAD_IDENTITY_PROVIDER` | `projects/337169955487/locations/global/workloadIdentityPools/github-pool/providers/github-provider` |
| `GCP_SERVICE_ACCOUNT_EMAIL` | `github-actions-deployer@wrapmind.iam.gserviceaccount.com` |
| `GCP_REGION` | `us-west-2` |
| `STAGING_SERVICE_NAME` | `wrapmind-data-staging` |
| `PRODUCTION_SERVICE_NAME` | `wrapmind-data-prod` |

---

## 2. GitHub Environments

Go to: `https://github.com/wraplabsinc/wrapos-data/settings/environments`

### Create `staging` environment
Add these **Environment secrets**:

| Secret Name | Value |
|-------------|-------|
| `SUPABASE_URL` | `https://your-project.supabase.co` |
| `SUPABASE_ANON_KEY` | (from Supabase dashboard) |
| `SUPABASE_SERVICE_ROLE_KEY` | (from Supabase dashboard) |
| `JWT_SECRET` | (generate random 64-char string) |
| `ANTHROPIC_API_KEY` | `sk-ant-...` |
| `TWILIO_ACCOUNT_SID` | (from Twilio) |
| `TWILIO_AUTH_TOKEN` | (from Twilio) |
| `TWILIO_FROM_NUMBER` | (from Twilio) |
| `SENDGRID_API_KEY` | (from SendGrid) |
| `SLACK_WEBHOOK_URL` | (from Slack app) |

Add these **Environment variables**:

| Variable Name | Value |
|---------------|-------|
| `ANTHROPIC_MODEL` | `claude-sonnet-4-20250514` |
| `ESTIMATE_PREFIX` | `WL` |
| `FRONTEND_URL` | `https://your-frontend.com` |
| `PORT` | `3001` |
| `NODE_ENV` | `production` |

### Create `production` environment
Same secrets/variables but with **production values**.

---

## 3. Workflow File

Create file: `.github/workflows/deploy.yml`

```yaml
name: Deploy to Cloud Run

on:
  workflow_dispatch:
    inputs:
      environment:
        description: 'Environment to deploy'
        required: true
        type: choice
        options:
          - staging
          - production

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: 'read'
      id-token: 'write'

    environment:
      name: ${{ github.inputs.environment }}
      url: ${{ steps.deploy.outputs.url }}

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Authenticate to Google Cloud
        uses: google-github-actions/auth@v2
        with:
          workload_identity_provider: ${{ secrets.GCP_WORKLOAD_IDENTITY_PROVIDER }}
          service_account: ${{ secrets.GCP_SERVICE_ACCOUNT_EMAIL }}
          project_id: ${{ secrets.GCP_PROJECT_ID }}

      - name: Set up Cloud SDK
        uses: google-github-actions/setup-gcloud@v2

      - name: Deploy to Cloud Run
        id: deploy
        run: |
          SERVICE_NAME="${{ github.inputs.environment == 'staging' && secrets.STAGING_SERVICE_NAME || secrets.PRODUCTION_SERVICE_NAME }}"

          gcloud run deploy "$SERVICE_NAME" \
            --source . \
            --region "${{ secrets.GCP_REGION }}" \
            --platform managed \
            --allow-unauthenticated \
            --set-env-vars "PORT=3001,NODE_ENV=production" \
            --project "${{ secrets.GCP_PROJECT_ID }}"

        env:
          SUPABASE_URL: ${{ vars.SUPABASE_URL }}
          SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
          JWT_SECRET: ${{ secrets.JWT_SECRET }}
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          ANTHROPIC_MODEL: ${{ vars.ANTHROPIC_MODEL }}
          FRONTEND_URL: ${{ vars.FRONTEND_URL }}
          TWILIO_ACCOUNT_SID: ${{ secrets.TWILIO_ACCOUNT_SID }}
          TWILIO_AUTH_TOKEN: ${{ secrets.TWILIO_AUTH_TOKEN }}
          TWILIO_FROM_NUMBER: ${{ secrets.TWILIO_FROM_NUMBER }}
          SENDGRID_API_KEY: ${{ secrets.SENDGRID_API_KEY }}
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
          ESTIMATE_PREFIX: ${{ vars.ESTIMATE_PREFIX }}
```

---

## Summary Checklist

- [x] Add 6 repository secrets
- [x] Create `staging` environment with secrets + variables
- [x] Create `production` environment with secrets + variables
- [x] Create `.github/workflows/deploy.yml`
- [ ] Run workflow manually to test
