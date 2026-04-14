const { createTestApp, createUnauthenticatedRequest } = require('./helpers/testApp');

describe('GET /api/health', () => {
  let app;
  let request;

  beforeEach(() => {
    jest.resetModules();
    app = createTestApp();
    request = createUnauthenticatedRequest(app);
  });

  it('should return 200 with health status', async () => {
    const res = await request.get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
    expect(res.body).toHaveProperty('timestamp');
    expect(res.body).toHaveProperty('version', '6.0.0');
  });

  it('should not require authentication', async () => {
    const res = await request.get('/api/health');

    expect(res.status).toBe(200);
  });
});
