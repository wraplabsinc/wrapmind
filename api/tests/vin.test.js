const { createTestApp, createAuthenticatedRequest, createUnauthenticatedRequest } = require('./helpers/testApp');

describe('GET /api/vin/:vin', () => {
  let app;
  let authenticatedRequest;
  let unauthenticatedRequest;

  beforeEach(() => {
    jest.resetModules();
    app = createTestApp();
    authenticatedRequest = createAuthenticatedRequest(app);
    unauthenticatedRequest = createUnauthenticatedRequest(app);
  });

  it('should return 401 when unauthenticated', async () => {
    const res = await unauthenticatedRequest.get('/api/vin/WP0AA2A9XPS123456');

    expect(res.status).toBe(401);
  });
});

describe('GET /api/plate/:state/:plate', () => {
  let app;
  let unauthenticatedRequest;

  beforeEach(() => {
    jest.resetModules();
    app = createTestApp();
    unauthenticatedRequest = createUnauthenticatedRequest(app);
  });

  it('should return 401 when unauthenticated', async () => {
    const res = await unauthenticatedRequest.get('/api/plate/CA/8ABC123');

    expect(res.status).toBe(401);
  });
});
