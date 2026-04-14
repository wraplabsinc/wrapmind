const { createTestApp, createAuthenticatedRequest, createUnauthenticatedRequest } = require('./helpers/testApp');

describe('POST /api/vision/analyze', () => {
  let app;
  let authenticatedRequest;
  let unauthenticatedRequest;

  beforeEach(() => {
    jest.resetModules();
    app = createTestApp();
    authenticatedRequest = createAuthenticatedRequest(app);
    unauthenticatedRequest = createUnauthenticatedRequest(app);
  });

  it('should return 400 when no files uploaded', async () => {
    const res = await authenticatedRequest
      .post('/api/vision/analyze')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('should return 401 when unauthenticated', async () => {
    const res = await unauthenticatedRequest
      .post('/api/vision/analyze')
      .send({});

    expect(res.status).toBe(401);
  });
});
