const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { errorHandler, notFoundHandler } = require('../../src/middleware/errorHandler');

function createTestApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: '*', credentials: true }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '6.0.0' });
  });

  app.use('/api/auth', require('../../src/routes/auth'));
  app.use('/api/estimates', require('../../src/routes/estimates'));
  app.use('/api/clients', require('../../src/routes/clients'));
  app.use('/api/settings', require('../../src/routes/settings'));
  app.use('/api/film', require('../../src/routes/film'));
  app.use('/api/vision', require('../../src/routes/vision'));
  app.use('/api/ai', require('../../src/routes/ai'));
  app.use('/api/intake', require('../../src/routes/intake'));
  app.use('/api/upsells', require('../../src/routes/upsells'));
  app.use('/api/search', require('../../src/routes/search'));
  app.use('/api', require('../../src/routes/vin'));
  app.use('/api/export', require('../../src/routes/export'));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

const jwt = require('jsonwebtoken');
const supertest = require('supertest');

const TEST_USER = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'test@wrapiq.com',
  role: 'owner',
  org_id: '00000000-0000-0000-0000-000000000001',
};

const TEST_WRITER = {
  id: '00000000-0000-0000-0000-000000000002',
  email: 'writer@wrapiq.com',
  role: 'writer',
  org_id: '00000000-0000-0000-0000-000000000001',
};

function createAuthenticatedRequest(app, userOverrides = {}) {
  const user = { ...TEST_USER, ...userOverrides };
  const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '1h' });
  const agent = supertest.agent(app);
  agent.set('Authorization', `Bearer ${token}`);
  return agent;
}

function createUnauthenticatedRequest(app) {
  return supertest.agent(app);
}

function getSupabaseMock() {
  return null;
}

function getAnthropicMock() {
  return null;
}

module.exports = {
  createTestApp,
  createAuthenticatedRequest,
  createUnauthenticatedRequest,
  getSupabaseMock,
  getAnthropicMock,
  TEST_USER,
  TEST_WRITER,
};
