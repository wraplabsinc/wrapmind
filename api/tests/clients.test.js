const { createTestApp, createAuthenticatedRequest, createUnauthenticatedRequest } = require('./helpers/testApp');

const REAL_CLIENT_ID = '00000000-0000-0000-0000-000000000010';

describe('GET /api/clients', () => {
  let app;
  let authenticatedRequest;
  let unauthenticatedRequest;

  beforeEach(() => {
    jest.resetModules();
    app = createTestApp();
    authenticatedRequest = createAuthenticatedRequest(app);
    unauthenticatedRequest = createUnauthenticatedRequest(app);
  });

  it('should return 200 with paginated clients', async () => {
    const res = await authenticatedRequest.get('/api/clients');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('clients');
    expect(Array.isArray(res.body.clients)).toBe(true);
    expect(res.body).toHaveProperty('pagination');
  });

  it('should return 200 with search query', async () => {
    const res = await authenticatedRequest.get('/api/clients?q=john');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('clients');
  });

  it('should return 401 when unauthenticated', async () => {
    const res = await unauthenticatedRequest.get('/api/clients');

    expect(res.status).toBe(401);
  });
});

describe('POST /api/clients', () => {
  let app;
  let authenticatedRequest;
  let unauthenticatedRequest;

  beforeEach(() => {
    jest.resetModules();
    app = createTestApp();
    authenticatedRequest = createAuthenticatedRequest(app);
    unauthenticatedRequest = createUnauthenticatedRequest(app);
  });

  it('should return 201 with created client', async () => {
    const res = await authenticatedRequest
      .post('/api/clients')
      .send({
        first_name: 'Bob',
        last_name: 'Wilson',
        phone: '+18055559999',
        email: `bob_${Date.now()}@example.com`,
        preferred_contact: 'email',
      });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('client');
  });

  it('should return 400 or 500 on missing required fields', async () => {
    const res = await authenticatedRequest
      .post('/api/clients')
      .send({ first_name: 'Jane' });

    expect([400, 500]).toContain(res.status);
  });

  it('should return 401 when unauthenticated', async () => {
    const res = await unauthenticatedRequest
      .post('/api/clients')
      .send({ first_name: 'Jane', last_name: 'Doe' });

    expect(res.status).toBe(401);
  });
});

describe('GET /api/clients/:id', () => {
  let app;
  let authenticatedRequest;
  let unauthenticatedRequest;

  beforeEach(() => {
    jest.resetModules();
    app = createTestApp();
    authenticatedRequest = createAuthenticatedRequest(app);
    unauthenticatedRequest = createUnauthenticatedRequest(app);
  });

  it('should return 200 with client and estimates history', async () => {
    const res = await authenticatedRequest.get(`/api/clients/${REAL_CLIENT_ID}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('client');
    expect(res.body.client).toHaveProperty('id');
  });

  it('should return 404 when client not found', async () => {
    const res = await authenticatedRequest.get('/api/clients/00000000-0000-0000-0000-000000000999');

    expect(res.status).toBe(404);
  });

  it('should return 401 when unauthenticated', async () => {
    const res = await unauthenticatedRequest.get(`/api/clients/${REAL_CLIENT_ID}`);

    expect(res.status).toBe(401);
  });
});

describe('PATCH /api/clients/:id', () => {
  let app;
  let authenticatedRequest;
  let unauthenticatedRequest;

  beforeEach(() => {
    jest.resetModules();
    app = createTestApp();
    authenticatedRequest = createAuthenticatedRequest(app);
    unauthenticatedRequest = createUnauthenticatedRequest(app);
  });

  it('should return 200 with updated client', async () => {
    const res = await authenticatedRequest
      .patch(`/api/clients/${REAL_CLIENT_ID}`)
      .send({ phone: '+18055551234', internal_notes: 'Updated notes' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('client');
  });

  it('should return 401 when unauthenticated', async () => {
    const res = await unauthenticatedRequest
      .patch(`/api/clients/${REAL_CLIENT_ID}`)
      .send({ phone: '+18055551234' });

    expect(res.status).toBe(401);
  });
});
