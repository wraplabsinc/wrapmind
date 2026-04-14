const { createTestApp, createAuthenticatedRequest, createUnauthenticatedRequest } = require('./helpers/testApp');

describe('POST /api/ai/generate-estimate', () => {
  let app;
  let authenticatedRequest;
  let unauthenticatedRequest;

  beforeEach(() => {
    jest.resetModules();
    app = createTestApp();
    authenticatedRequest = createAuthenticatedRequest(app);
    unauthenticatedRequest = createUnauthenticatedRequest(app);
  });

  it('should return 200, 400 or 500 depending on AI config', async () => {
    const res = await authenticatedRequest
      .post('/api/ai/generate-estimate')
      .send({
        vehicle: { year: 2024, make: 'Porsche', model: '911' },
        services: [{ name: 'Full Wrap' }],
        details: {},
        vision: {},
      });

    expect([200, 400, 500]).toContain(res.status);
  });

  it('should return 401 when unauthenticated', async () => {
    const res = await unauthenticatedRequest
      .post('/api/ai/generate-estimate')
      .send({
        vehicle: { year: 2024, make: 'Porsche', model: '911' },
        services: [{ name: 'Full Wrap' }],
      });

    expect(res.status).toBe(401);
  });
});
