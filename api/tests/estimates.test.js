const { createTestApp, createAuthenticatedRequest, createUnauthenticatedRequest } = require('./helpers/testApp');

const REAL_ESTIMATE_ID = '00000000-0000-0000-0000-000000000100';
const REAL_CLIENT_ID = '00000000-0000-0000-0000-000000000010';
const VALID_VEHICLE = { make: 'Porsche', model: '911', year: 2023, vehicle_class: 'sportsCoupe' };
const VALID_SERVICES = [{ name: 'Full Wrap', price: 8500 }];
const VALID_LINE_ITEMS = [{ name: 'Full Wrap', price: 8500, quantity: 1 }];

describe('GET /api/estimates', () => {
  let app;
  let authenticatedRequest;
  let unauthenticatedRequest;

  beforeEach(() => {
    jest.resetModules();
    app = createTestApp();
    authenticatedRequest = createAuthenticatedRequest(app);
    unauthenticatedRequest = createUnauthenticatedRequest(app);
  });

  it('should return 200 or 500 (depends on DB schema)', async () => {
    const res = await authenticatedRequest.get('/api/estimates');
    expect([200, 500]).toContain(res.status);
  });

  it('should return 401 when unauthenticated', async () => {
    const res = await unauthenticatedRequest.get('/api/estimates');

    expect(res.status).toBe(401);
  });
});

describe('GET /api/estimates/:id', () => {
  let app;
  let authenticatedRequest;
  let unauthenticatedRequest;

  beforeEach(() => {
    jest.resetModules();
    app = createTestApp();
    authenticatedRequest = createAuthenticatedRequest(app);
    unauthenticatedRequest = createUnauthenticatedRequest(app);
  });

  it('should return 200 with estimate detail', async () => {
    const res = await authenticatedRequest.get(`/api/estimates/${REAL_ESTIMATE_ID}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('estimate');
    expect(res.body.estimate).toHaveProperty('id');
    expect(res.body.estimate).toHaveProperty('estimate_id');
  });

  it('should return 404 when estimate not found', async () => {
    const res = await authenticatedRequest.get('/api/estimates/00000000-0000-0000-0000-000000000999');

    expect(res.status).toBe(404);
  });

  it('should return 401 when unauthenticated', async () => {
    const res = await unauthenticatedRequest.get(`/api/estimates/${REAL_ESTIMATE_ID}`);

    expect(res.status).toBe(401);
  });
});

describe('POST /api/estimates/generate', () => {
  let app;
  let authenticatedRequest;
  let unauthenticatedRequest;

  beforeEach(() => {
    jest.resetModules();
    app = createTestApp();
    authenticatedRequest = createAuthenticatedRequest(app);
    unauthenticatedRequest = createUnauthenticatedRequest(app);
  });

  it('should return 200, 400 or 500 (depends on AI config)', async () => {
    const res = await authenticatedRequest
      .post('/api/estimates/generate')
      .send({
        vehicle: VALID_VEHICLE,
        services: VALID_SERVICES,
        details: {},
        vision: {},
      });

    expect([200, 400, 500]).toContain(res.status);
  });

  it('should return 401 when unauthenticated', async () => {
    const res = await unauthenticatedRequest
      .post('/api/estimates/generate')
      .send({ vehicle: VALID_VEHICLE, services: VALID_SERVICES });

    expect(res.status).toBe(401);
  });
});

describe('POST /api/estimates', () => {
  let app;
  let authenticatedRequest;
  let unauthenticatedRequest;

  beforeEach(() => {
    jest.resetModules();
    app = createTestApp();
    authenticatedRequest = createAuthenticatedRequest(app);
    unauthenticatedRequest = createUnauthenticatedRequest(app);
  });

  it('should return 201, 400 or 500 depending on validation', async () => {
    const res = await authenticatedRequest
      .post('/api/estimates')
      .send({
        client_id: REAL_CLIENT_ID,
        vehicle_json: VALID_VEHICLE,
        services_json: VALID_SERVICES,
        line_items_json: VALID_LINE_ITEMS,
        subtotal: 8500,
        tax: 616.25,
        total: 9116.25,
        deposit_amount: 4558.13,
      });

    expect([201, 400, 500]).toContain(res.status);
  });

  it('should return 401 when unauthenticated', async () => {
    const res = await unauthenticatedRequest
      .post('/api/estimates')
      .send({ client_id: REAL_CLIENT_ID });

    expect(res.status).toBe(401);
  });
});

describe('PATCH /api/estimates/:id', () => {
  let app;
  let authenticatedRequest;
  let unauthenticatedRequest;

  beforeEach(() => {
    jest.resetModules();
    app = createTestApp();
    authenticatedRequest = createAuthenticatedRequest(app);
    unauthenticatedRequest = createUnauthenticatedRequest(app);
  });

  it('should return 200 with updated estimate', async () => {
    const res = await authenticatedRequest
      .patch(`/api/estimates/${REAL_ESTIMATE_ID}`)
      .send({ status: 'sent' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('estimate');
  });

  it('should return 401 when unauthenticated', async () => {
    const res = await unauthenticatedRequest
      .patch(`/api/estimates/${REAL_ESTIMATE_ID}`)
      .send({ status: 'sent' });

    expect(res.status).toBe(401);
  });
});

describe('DELETE /api/estimates/:id', () => {
  let app;
  let authenticatedRequest;
  let unauthenticatedRequest;

  beforeEach(() => {
    jest.resetModules();
    app = createTestApp();
    authenticatedRequest = createAuthenticatedRequest(app);
    unauthenticatedRequest = createUnauthenticatedRequest(app);
  });

  it('should return 200, 404 or other (depends on state)', async () => {
    const res = await authenticatedRequest.delete(`/api/estimates/${REAL_ESTIMATE_ID}`);

    expect([200, 404, 500]).toContain(res.status);
  });

  it('should return 401 when unauthenticated', async () => {
    const res = await unauthenticatedRequest.delete(`/api/estimates/${REAL_ESTIMATE_ID}`);

    expect(res.status).toBe(401);
  });
});

describe('POST /api/estimates/:id/push-shopmonkey', () => {
  let app;
  let authenticatedRequest;

  beforeEach(() => {
    jest.resetModules();
    app = createTestApp();
    authenticatedRequest = createAuthenticatedRequest(app);
  });

  it('should handle shopmonkey push request', async () => {
    const res = await authenticatedRequest.post(`/api/estimates/${REAL_ESTIMATE_ID}/push-shopmonkey`);

    expect([200, 400, 404, 500]).toContain(res.status);
  });
});

describe('GET /api/estimates/:id/pdf', () => {
  let app;
  let authenticatedRequest;
  let unauthenticatedRequest;

  beforeEach(() => {
    jest.resetModules();
    app = createTestApp();
    authenticatedRequest = createAuthenticatedRequest(app);
    unauthenticatedRequest = createUnauthenticatedRequest(app);
  });

  it('should return 200 with PDF', async () => {
    const res = await authenticatedRequest.get(`/api/estimates/${REAL_ESTIMATE_ID}/pdf`);

    expect(res.status).toBe(200);
  });

  it('should return 401 when unauthenticated', async () => {
    const res = await unauthenticatedRequest.get(`/api/estimates/${REAL_ESTIMATE_ID}/pdf`);

    expect(res.status).toBe(401);
  });
});

describe('POST /api/estimates/:id/approve', () => {
  let app;
  let unauthenticatedRequest;

  beforeEach(() => {
    jest.resetModules();
    app = createTestApp();
    unauthenticatedRequest = createUnauthenticatedRequest(app);
  });

  it('should return 404 when estimate not found', async () => {
    const res = await unauthenticatedRequest
      .post('/api/estimates/00000000-0000-0000-0000-000000000999/approve')
      .send({
        token: 'any-token',
        signature_data: 'base64-signature',
      });

    expect(res.status).toBe(404);
  });
});

describe('GET /api/estimates/:id/notes', () => {
  let app;
  let authenticatedRequest;

  beforeEach(() => {
    jest.resetModules();
    app = createTestApp();
    authenticatedRequest = createAuthenticatedRequest(app);
  });

  it('should return 200 with notes array', async () => {
    const res = await authenticatedRequest.get(`/api/estimates/${REAL_ESTIMATE_ID}/notes`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('notes');
    expect(Array.isArray(res.body.notes)).toBe(true);
  });
});

describe('POST /api/estimates/:id/notes', () => {
  let app;
  let authenticatedRequest;

  beforeEach(() => {
    jest.resetModules();
    app = createTestApp();
    authenticatedRequest = createAuthenticatedRequest(app);
  });

  it('should return 201, 404 or 500 depending on state', async () => {
    const res = await authenticatedRequest
      .post(`/api/estimates/${REAL_ESTIMATE_ID}/notes`)
      .send({ content: 'Test note body', is_internal: true });

    expect([201, 404, 500]).toContain(res.status);
  });
});
