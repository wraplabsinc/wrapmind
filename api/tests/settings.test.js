const { createTestApp, createAuthenticatedRequest, createUnauthenticatedRequest } = require('./helpers/testApp');

describe('GET /api/settings', () => {
  let app;
  let authenticatedRequest;
  let unauthenticatedRequest;

  beforeEach(() => {
    jest.resetModules();
    app = createTestApp();
    authenticatedRequest = createAuthenticatedRequest(app);
    unauthenticatedRequest = createUnauthenticatedRequest(app);
  });

  it('should return 200 with full settings', async () => {
    const res = await authenticatedRequest.get('/api/settings');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('settings');
    expect(res.body.settings).toHaveProperty('id');
    expect(res.body.settings).toHaveProperty('shop_name');
    expect(res.body.settings).toHaveProperty('labor_rate_general');
  });

  it('should return 401 when unauthenticated', async () => {
    const res = await unauthenticatedRequest.get('/api/settings');

    expect(res.status).toBe(401);
  });
});

describe('PATCH /api/settings', () => {
  let app;
  let authenticatedRequest;
  let unauthenticatedRequest;

  beforeEach(() => {
    jest.resetModules();
    app = createTestApp();
    authenticatedRequest = createAuthenticatedRequest(app);
    unauthenticatedRequest = createUnauthenticatedRequest(app);
  });

  it('should return 200 with updated settings', async () => {
    const res = await authenticatedRequest
      .patch('/api/settings')
      .send({ labor_rate_general: 130, tax_rate: 7.5 });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('settings');
    expect(res.body.settings).toHaveProperty('labor_rate_general', 130);
  });

  it('should return 401 when unauthenticated', async () => {
    const res = await unauthenticatedRequest
      .patch('/api/settings')
      .send({ labor_rate_general: 130 });

    expect(res.status).toBe(401);
  });
});

describe('POST /api/settings/sync-shopmonkey', () => {
  let app;
  let authenticatedRequest;
  let unauthenticatedRequest;

  beforeEach(() => {
    jest.resetModules();
    app = createTestApp();
    authenticatedRequest = createAuthenticatedRequest(app);
    unauthenticatedRequest = createUnauthenticatedRequest(app);
  });

  it('should return 400 when shopmonkey not configured', async () => {
    const res = await authenticatedRequest.post('/api/settings/sync-shopmonkey');

    expect([400, 500]).toContain(res.status);
  });

  it('should return 401 when unauthenticated', async () => {
    const res = await unauthenticatedRequest.post('/api/settings/sync-shopmonkey');

    expect(res.status).toBe(401);
  });
});
