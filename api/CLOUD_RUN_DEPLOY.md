# Cloud Run Deployment Summary

## Current Status
**DEPLOYMENT WORKS** - The minimal app with middleware and lazy-loaded routes successfully deploys to Google Cloud Run (us-west2).

## What We Fixed

### 1. Port Configuration
- Cloud Run automatically sets `PORT` environment variable (not `API_ENDPOINT_PORT`)
- App now reads: `process.env.PORT || process.env.API_ENDPOINT_PORT || 3001`
- Server binds to `0.0.0.0` (not `localhost`)

### 2. Health Endpoints
Added multiple health check endpoints:
- `GET /` - returns `{ status: 'ok', service: 'WrapIQ API', version: '6.0.0' }`
- `GET /health` - returns `{ status: 'ok' }`
- `GET /api/health` - returns `{ status: 'ok', timestamp, version }`

### 3. Lazy-Loaded Routes
Routes are loaded on first request, not at startup, to prevent crashes from broken route modules:
```javascript
app.use('/api', (req, res, next) => {
  try {
    const routes = require('./routes');
    routes(req, res, next);
  } catch (err) {
    console.error('Error loading routes:', err);
    next(err);
  }
});
```

### 4. Deploy Command Flags
```
--port 3001
--allow-unauthenticated
--timeout 600s
--min-instances 0
--max-instances 10
```

## GitHub Secrets/Vars (Staging)
Set from local `.env`:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `JWT_SECRET`
- `ANTHROPIC_API_KEY` (not set yet - needed for AI features)
- Variables: `ANTHROPIC_MODEL`, `ESTIMATE_PREFIX`, `FRONTEND_URL`

## Remaining Work
1. **Restore full app functionality** - The minimal version works. Need to add back all the route handlers and business logic by testing incrementally
2. **Set `ANTHROPIC_API_KEY`** - Required secret not yet set in GitHub
3. **Set `TWILIO_*` secrets** - Twilio credentials for SMS notifications
4. **Set `SENDGRID_API_KEY`** - For email notifications
5. **Set `SLACK_WEBHOOK_URL`** - For Slack notifications
6. **Test all API endpoints** - Health checks work, but actual API functionality untested on Cloud Run

## Testing Approach
Deploy incrementally and test after each addition:
1. Minimal app (no routes) ✓
2. + Middleware (cors, helmet, morgan, rate limiter) ✓
3. + Lazy-loaded routes ✓
4. Next: Add back route handlers one at a time

## Key Files
- `src/app.js` - Main application with lazy route loading
- `src/config/index.js` - Configuration (reads PORT env var)
- `.github/workflows/deploy.yml` - Cloud Run deployment workflow
- `Dockerfile` - Node 20-slim based image

## Cloud Run Service Details
- Service name: `wrapmind-api` (from `STAGING_SERVICE_NAME` secret)
- Region: `us-west2`
- Project: `wrapos-data` (from `GCP_PROJECT_ID` secret)
- Repository: `us-west2-docker.pkg.dev/{project}/github/wrapmind-api`
