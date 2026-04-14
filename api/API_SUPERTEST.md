# WrapIQ SuperTest Harness — Usage Guide

Complete test suite for the WrapIQ Express API (v6.0). Covers all 25+ endpoints with happy path and error case tests.

---

## Quick Start

```bash
# Install dependencies (includes jest + supertest)
npm install

# Run all tests
npm test

# Run with file watcher
npm run test:watch

# Run with coverage report
npm run test:coverage

# Run a single test file
npx jest tests/auth.test.js

# Run tests matching a pattern
npx jest --testNamePattern "POST /api/auth/login"

# Run with verbose output
npm test -- --verbose
```

---

## Project Structure

```
tests/
├── jest.config.js          # Jest configuration
├── setup.js                # Global test setup (env vars, mocks)
├── helpers/
│   └── testApp.js          # Test app factory + auth helper
├── fixtures/
│   └── data.js             # Reusable test data objects
├── mocks/
│   ├── supabase.js         # Supabase client mock (chainable)
│   └── anthropic.js        # Anthropic Claude API mock
├── auth.test.js            # POST /api/auth/* (login, logout, me)
├── estimates.test.js       # GET/POST/PATCH/DELETE /api/estimates/*
├── clients.test.js         # GET/POST/PATCH /api/clients/*
├── settings.test.js        # GET/PATCH /api/settings, POST sync-shopmonkey
├── film.test.js            # POST /api/film/calculate, GET supplier-sheet
├── vision.test.js          # POST /api/vision/analyze
├── ai.test.js              # POST /api/ai/generate-estimate
├── intake.test.js          # POST /api/intake, GET/POST/PATCH /api/leads/*
├── upsells.test.js         # GET /api/upsells/analytics, PATCH /api/upsells/:id
├── search.test.js          # GET /api/search
├── export.test.js          # GET /api/export/estimates
├── vin.test.js             # GET /api/vin/:vin, GET /api/plate/:state/:plate
└── health.test.js          # GET /api/health
```

---

## How It Works

### Test App Factory

The test harness creates an Express app instance with **all external services mocked**:

- **Supabase** — chainable mock (`.from().select().eq().single()`) returns configurable `{ data, error }`
- **Anthropic** — `messages.create()` returns parsed JSON response
- **Twilio / SendGrid / Slack** — no-op mocks (don't send real messages)
- **Shopmonkey** — mock HTTP responses for order push flow

The real Express routes and controllers are used — only the I/O layer is mocked.

### Authentication Helper

```js
const { createApp, createAuthenticatedRequest } = require('./helpers/testApp');
const { validUser } = require('./fixtures/data');

const app = createApp();
const request = createAuthenticatedRequest(app, validUser);

// `request` is a supertest agent with a valid JWT baked in
const res = await request.get('/api/estimates').expect(200);
```

### Test Data Fixtures

All reusable test data lives in `tests/fixtures/data.js`:

```js
const {
  validUser,        // Test user (owner role)
  validVehicle,     // Porsche 911 test vehicle
  validServices,    // Full Color Change Wrap
  validDetails,     // Complexity flags, referral, notes
  validVisionReport, // AI vision analysis result
  validLineItems,   // Labor + material line items
  validEstimate,    // Complete estimate object
  validClient,      // John Doe test client
  validSettings,    // Full shop settings
  validLead,        // Mike Johnson test lead
} = require('./fixtures/data');
```

---

## Writing New Tests

### Basic Pattern

```js
const { createApp, createAuthenticatedRequest } = require('./helpers/testApp');
const { validUser, validClient } = require('./fixtures/data');

describe('POST /api/clients', () => {
  let app, request;

  beforeAll(() => {
    app = createApp();
    request = createAuthenticatedRequest(app, validUser);
  });

  it('creates a new client (201)', async () => {
    const res = await request
      .post('/api/clients')
      .send(validClient)
      .expect(201);

    expect(res.body).toHaveProperty('id');
    expect(res.body.first_name).toBe('John');
    expect(res.body.email).toBe('john@example.com');
  });

  it('returns 409 for duplicate client', async () => {
    const res = await request
      .post('/api/clients')
      .send(validClient)
      .expect(409);

    expect(res.body).toHaveProperty('error', 'Client already exists');
    expect(res.body).toHaveProperty('existing_client');
  });

  it('returns 401 without auth', async () => {
    const unauthed = require('supertest')(app);
    await unauthed
      .post('/api/clients')
      .send(validClient)
      .expect(401);
  });
});
```

### Mocking Supabase Responses

Override mock behavior per test:

```js
const { mockSupabase } = require('./mocks/supabase');

beforeEach(() => {
  mockSupabase.setResponse({
    data: { id: 'test-uuid', ...validClient },
    error: null,
  });
});

it('returns the client from DB', async () => {
  const res = await request.get('/api/clients/test-id').expect(200);
  expect(res.body.id).toBe('test-uuid');
});
```

### Testing Error Paths

```js
it('returns 400 for missing required fields', async () => {
  const res = await request
    .post('/api/clients')
    .send({ first_name: 'John' })
    .expect(400);

  expect(res.body).toHaveProperty('error');
  expect(res.body.details).toContainEqual(
    expect.objectContaining({ field: expect.any(String) })
  );
});
```

---

## Running Tests

### All Tests

```bash
npm test
```

### Single File

```bash
npx jest tests/estimates.test.js
```

### Pattern Match

```bash
# All estimate tests
npx jest --testPathPattern estimates

# Specific test by name
npx jest --testNamePattern "POST /api/estimates/generate"
```

### Watch Mode

```bash
npm run test:watch
```

### Coverage

```bash
npm run test:coverage
```

Output: `coverage/lcov-report/index.html` (open in browser)

### CI Mode

```bash
npx jest --ci --coverage --runInBand
```

---

## Test Categories

| File | Endpoints Covered | Test Count |
|------|-------------------|------------|
| `auth.test.js` | `/api/auth/login`, `/api/auth/logout`, `/api/auth/me` | ~9 |
| `estimates.test.js` | All estimate routes (11 endpoints) | ~25 |
| `clients.test.js` | All client routes (4 endpoints) | ~10 |
| `settings.test.js` | All settings routes (3 endpoints) | ~6 |
| `film.test.js` | Film calc + supplier sheet (2 endpoints) | ~5 |
| `vision.test.js` | Vision analysis (1 endpoint) | ~3 |
| `ai.test.js` | AI generation (1 endpoint) | ~3 |
| `intake.test.js` | Intake + leads (5 endpoints) | ~12 |
| `upsells.test.js` | Upsell analytics + toggle (2 endpoints) | ~4 |
| `search.test.js` | Global search (1 endpoint) | ~3 |
| `export.test.js` | CSV/JSON export (1 endpoint) | ~4 |
| `vin.test.js` | VIN decode + plate lookup (2 endpoints) | ~5 |
| `health.test.js` | Health check (1 endpoint) | ~2 |
| **Total** | **25+ endpoints** | **~91 tests** |

---

## Mock Architecture

```
┌─────────────────────────────────────────────┐
│                 Test File                   │
│  (estimates.test.js, auth.test.js, etc.)   │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│           testApp.js (helper)               │
│  - Creates Express app                      │
│  - Mounts real routes from src/routes/      │
│  - Injects mocked services                  │
│  - createAuthenticatedRequest() helper      │
└──────────────┬──────────────────────────────┘
               │
    ┌──────────┼──────────┐
    ▼          ▼          ▼
┌────────┐ ┌────────┐ ┌──────────┐
│Supabase│ │Anthropic│ │Twilio/   │
│ Mock   │ │ Mock    │ │SendGrid  │
│        │ │         │ │/Slack    │
└────────┘ └─────────┘ └──────────┘
```

Supabase mock supports the full chainable API:

```js
supabase.from('estimates').select('*').eq('status', 'draft').single()
```

Returns whatever you configure via `mockSupabase.setResponse()`.

---

## Troubleshooting

### "Cannot find module '@supabase/supabase-js'"

```bash
npm install
```

### Tests hang / timeout

```bash
# Force exit after tests
npx jest --forceExit --detectOpenHandles
```

### Mock not returning expected data

Check `tests/mocks/supabase.js` — the mock uses a response queue. Set the response before the test:

```js
beforeEach(() => {
  mockSupabase.setResponse({ data: { id: 'test-uuid' }, error: null });
});
```

### Auth helper not working

Ensure you're passing a valid user object with `id`, `role`, and `org_id`:

```js
const request = createAuthenticatedRequest(app, {
  id: 'test-user-uuid',
  role: 'owner',
  org_id: 'test-org-uuid',
});
```

---

## Adding Tests for New Endpoints

1. Create `tests/newFeature.test.js`
2. Import `createApp`, `createAuthenticatedRequest` from `./helpers/testApp`
3. Import test data from `./fixtures/data`
4. Write `describe` blocks per endpoint
5. Test happy path (200/201) + error paths (400/401/403/404/409/429)
6. Run `npm test` to verify
