const { createTestApp, createAuthenticatedRequest, createUnauthenticatedRequest } = require('./helpers/testApp');

describe('GET /api/search', () => {
  let app;
  let authenticatedRequest;
  let unauthenticatedRequest;

  beforeEach(() => {
    jest.resetModules();
    app = createTestApp();
    authenticatedRequest = createAuthenticatedRequest(app);
    unauthenticatedRequest = createUnauthenticatedRequest(app);
  });

  it('should return 200 with grouped search results', async () => {
    const res = await authenticatedRequest.get('/api/search?q=porsche');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('query');
    expect(res.body).toHaveProperty('results');
    expect(res.body.results).toHaveProperty('clients');
    expect(res.body.results).toHaveProperty('estimates');
    expect(res.body.results).toHaveProperty('leads');
    expect(res.body.results).toHaveProperty('vehicles');
  });

  it('should return 400 when query is missing', async () => {
    const res = await authenticatedRequest.get('/api/search');

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('should return 401 when unauthenticated', async () => {
    const res = await unauthenticatedRequest.get('/api/search?q=porsche');

    expect(res.status).toBe(401);
  });
});
