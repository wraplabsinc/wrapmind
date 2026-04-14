const { createTestApp, createAuthenticatedRequest, createUnauthenticatedRequest } = require('./helpers/testApp');

describe('GET /api/upsells/analytics', () => {
  let app;
  let authenticatedRequest;
  let unauthenticatedRequest;

  beforeEach(() => {
    jest.resetModules();
    app = createTestApp();
    authenticatedRequest = createAuthenticatedRequest(app);
    unauthenticatedRequest = createUnauthenticatedRequest(app);
  });

  it('should return 200 with upsell analytics by service', async () => {
    const res = await authenticatedRequest.get('/api/upsells/analytics');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('analytics');
    expect(res.body.analytics).toHaveProperty('total');
    expect(res.body.analytics).toHaveProperty('presented');
    expect(res.body.analytics).toHaveProperty('accepted');
    expect(res.body.analytics).toHaveProperty('conversion_rate');
    expect(res.body.analytics).toHaveProperty('by_service');
  });

  it('should return 401 when unauthenticated', async () => {
    const res = await unauthenticatedRequest.get('/api/upsells/analytics');

    expect(res.status).toBe(401);
  });
});

describe('PATCH /api/upsells/:id', () => {
  let app;
  let authenticatedRequest;
  let unauthenticatedRequest;

  beforeEach(() => {
    jest.resetModules();
    app = createTestApp();
    authenticatedRequest = createAuthenticatedRequest(app);
    unauthenticatedRequest = createUnauthenticatedRequest(app);
  });

  it('should return 404 when upsell not found', async () => {
    const res = await authenticatedRequest
      .patch('/api/upsells/00000000-0000-0000-0000-000000000999')
      .send({ presented_to_client: true, accepted_by_client: true });

    expect(res.status).toBe(404);
  });

  it('should return 401 when unauthenticated', async () => {
    const res = await unauthenticatedRequest
      .patch('/api/upsells/00000000-0000-0000-0000-000000000999')
      .send({ presented_to_client: true });

    expect(res.status).toBe(401);
  });
});
