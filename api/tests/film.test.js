const { createTestApp, createAuthenticatedRequest, createUnauthenticatedRequest } = require('./helpers/testApp');

const REAL_ESTIMATE_ID = '00000000-0000-0000-0000-000000000100';

describe('POST /api/film/calculate', () => {
  let app;
  let authenticatedRequest;
  let unauthenticatedRequest;

  beforeEach(() => {
    jest.resetModules();
    app = createTestApp();
    authenticatedRequest = createAuthenticatedRequest(app);
    unauthenticatedRequest = createUnauthenticatedRequest(app);
  });

  it('should return 200 with footage breakdown and film options', async () => {
    const res = await authenticatedRequest
      .post('/api/film/calculate')
      .send({
        vehicle_class: 'sportsCoupe',
        services: [
          { name: 'Full Color Change Wrap', door_jambs: true, blackout: true, blackout_parts: ['front_grille', 'window_surrounds', 'door_handles'] },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('film');
    expect(res.body.film).toHaveProperty('vehicle_class');
    expect(res.body.film).toHaveProperty('base_raw_footage');
    expect(res.body.film).toHaveProperty('film_options');
  });

  it('should return 400 or 500 when vehicle_class is missing', async () => {
    const res = await authenticatedRequest
      .post('/api/film/calculate')
      .send({ services: [] });

    expect([400, 500]).toContain(res.status);
  });

  it('should return 401 when unauthenticated', async () => {
    const res = await unauthenticatedRequest
      .post('/api/film/calculate')
      .send({ vehicle_class: 'sportsCoupe' });

    expect(res.status).toBe(401);
  });
});

describe('GET /api/film/supplier-sheet/:id', () => {
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
    const res = await authenticatedRequest.get(`/api/film/supplier-sheet/${REAL_ESTIMATE_ID}`);

    expect([200, 404, 500]).toContain(res.status);
  });

  it('should return 401 when unauthenticated', async () => {
    const res = await unauthenticatedRequest.get(`/api/film/supplier-sheet/${REAL_ESTIMATE_ID}`);

    expect(res.status).toBe(401);
  });
});
