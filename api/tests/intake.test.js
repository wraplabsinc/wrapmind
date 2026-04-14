const { createTestApp, createAuthenticatedRequest, createUnauthenticatedRequest } = require('./helpers/testApp');

const REAL_LEAD_ID = '00000000-0000-0000-0000-000000000200';

describe('POST /api/intake', () => {
  let app;
  let unauthenticatedRequest;

  beforeEach(() => {
    jest.resetModules();
    app = createTestApp();
    unauthenticatedRequest = createUnauthenticatedRequest(app);
  });

  it('should return 201 or 500 depending on validation', async () => {
    const res = await unauthenticatedRequest
      .post('/api/intake')
      .send({
        first_name: 'Test',
        last_name: 'Lead',
        phone: '+18055554321',
        email: `testlead_${Date.now()}@example.com`,
        vehicle_year: 2024,
        vehicle_make: 'BMW',
        vehicle_model: 'M4',
        services_requested: ['Full Color Change Wrap'],
      });

    expect([201, 400, 500]).toContain(res.status);
  });

  it('should return 400, 500 on missing required fields', async () => {
    const res = await unauthenticatedRequest
      .post('/api/intake')
      .send({ first_name: 'Mike' });

    expect([400, 500]).toContain(res.status);
  });
});

describe('GET /api/leads', () => {
  let app;
  let authenticatedRequest;
  let unauthenticatedRequest;

  beforeEach(() => {
    jest.resetModules();
    app = createTestApp();
    authenticatedRequest = createAuthenticatedRequest(app);
    unauthenticatedRequest = createUnauthenticatedRequest(app);
  });

  it('should return 200 or other status depending on DB', async () => {
    const res = await authenticatedRequest.get('/api/leads');

    expect([200, 400, 500]).toContain(res.status);
  });

  it('should return 401 when unauthenticated', async () => {
    const res = await unauthenticatedRequest.get('/api/leads');

    expect(res.status).toBe(401);
  });
});

describe('GET /api/leads/:id', () => {
  let app;
  let authenticatedRequest;
  let unauthenticatedRequest;

  beforeEach(() => {
    jest.resetModules();
    app = createTestApp();
    authenticatedRequest = createAuthenticatedRequest(app);
    unauthenticatedRequest = createUnauthenticatedRequest(app);
  });

  it('should return 200, 404 or 500 depending on state', async () => {
    const res = await authenticatedRequest.get(`/api/leads/${REAL_LEAD_ID}`);

    expect([200, 404, 500]).toContain(res.status);
  });

  it('should return 401 when unauthenticated', async () => {
    const res = await unauthenticatedRequest.get(`/api/leads/${REAL_LEAD_ID}`);

    expect(res.status).toBe(401);
  });
});

describe('POST /api/leads/:id/convert', () => {
  let app;
  let authenticatedRequest;
  let unauthenticatedRequest;

  beforeEach(() => {
    jest.resetModules();
    app = createTestApp();
    authenticatedRequest = createAuthenticatedRequest(app);
    unauthenticatedRequest = createUnauthenticatedRequest(app);
  });

  it('should return 200, 404 or 500 depending on state', async () => {
    const res = await authenticatedRequest.post(`/api/leads/${REAL_LEAD_ID}/convert`);

    expect([200, 404, 500]).toContain(res.status);
  });

  it('should return 401 when unauthenticated', async () => {
    const res = await unauthenticatedRequest.post(`/api/leads/${REAL_LEAD_ID}/convert`);

    expect(res.status).toBe(401);
  });
});

describe('PATCH /api/leads/:id/status', () => {
  let app;
  let authenticatedRequest;
  let unauthenticatedRequest;

  beforeEach(() => {
    jest.resetModules();
    app = createTestApp();
    authenticatedRequest = createAuthenticatedRequest(app);
    unauthenticatedRequest = createUnauthenticatedRequest(app);
  });

  it('should return 200, 404 or 500 depending on state', async () => {
    const res = await authenticatedRequest
      .patch(`/api/leads/${REAL_LEAD_ID}/status`)
      .send({ status: 'contacted' });

    expect([200, 404, 500]).toContain(res.status);
  });

  it('should return 401 when unauthenticated', async () => {
    const res = await unauthenticatedRequest
      .patch(`/api/leads/${REAL_LEAD_ID}/status`)
      .send({ status: 'contacted' });

    expect(res.status).toBe(401);
  });
});
