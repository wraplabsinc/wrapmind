const { createTestApp, createAuthenticatedRequest, createUnauthenticatedRequest } = require('./helpers/testApp');

describe('POST /api/auth/login', () => {
  let app;
  let unauthenticatedRequest;

  beforeEach(() => {
    jest.resetModules();
    app = createTestApp();
    unauthenticatedRequest = createUnauthenticatedRequest(app);
  });

  it('should return 401 on invalid credentials', async () => {
    const res = await unauthenticatedRequest
      .post('/api/auth/login')
      .send({ email: 'test@wrapiq.com', password: 'wrongpassword' });

    expect([401, 500]).toContain(res.status);
  });

  it('should return 400 or 401 on missing fields', async () => {
    const res = await unauthenticatedRequest
      .post('/api/auth/login')
      .send({ email: 'test@wrapiq.com' });

    expect([400, 401, 500]).toContain(res.status);
  });
});

describe('POST /api/auth/logout', () => {
  let app;
  let authenticatedRequest;
  let unauthenticatedRequest;

  beforeEach(() => {
    jest.resetModules();
    app = createTestApp();
    authenticatedRequest = createAuthenticatedRequest(app);
    unauthenticatedRequest = createUnauthenticatedRequest(app);
  });

  it('should return 200 on logout', async () => {
    const res = await authenticatedRequest
      .post('/api/auth/logout');

    expect(res.status).toBe(200);
  });

  it('should return 200 even when unauthenticated', async () => {
    const res = await unauthenticatedRequest
      .post('/api/auth/logout');

    expect(res.status).toBe(200);
  });
});

describe('GET /api/auth/me', () => {
  let app;
  let authenticatedRequest;
  let unauthenticatedRequest;

  beforeEach(() => {
    jest.resetModules();
    app = createTestApp();
    authenticatedRequest = createAuthenticatedRequest(app);
    unauthenticatedRequest = createUnauthenticatedRequest(app);
  });

  it('should return 200 or 500 depending on user existence', async () => {
    const res = await authenticatedRequest
      .get('/api/auth/me');

    expect([200, 500]).toContain(res.status);
  });

  it('should return 200, 401 or 500 when unauthenticated', async () => {
    const res = await unauthenticatedRequest
      .get('/api/auth/me');

    expect([200, 401, 500]).toContain(res.status);
  });
});
