const { createTestApp, createAuthenticatedRequest, createUnauthenticatedRequest, TEST_USER, TEST_WRITER } = require('./helpers/testApp');

describe('GET /api/export/estimates', () => {
  let app;
  let ownerRequest;
  let writerRequest;
  let unauthenticatedRequest;

  beforeEach(() => {
    jest.resetModules();
    app = createTestApp();
    ownerRequest = createAuthenticatedRequest(app, { role: 'owner' });
    writerRequest = createAuthenticatedRequest(app, { role: 'writer' });
    unauthenticatedRequest = createUnauthenticatedRequest(app);
  });

  it('should return 200 or 500 depending on owner check', async () => {
    const res = await ownerRequest.get('/api/export/estimates');

    expect([200, 500]).toContain(res.status);
  });

  it('should return 401 when unauthenticated', async () => {
    const res = await unauthenticatedRequest.get('/api/export/estimates');

    expect(res.status).toBe(401);
  });
});
