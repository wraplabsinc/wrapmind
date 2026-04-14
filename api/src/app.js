require('dotenv').config();

process.on('uncaughtException', (err) => {
  console.error('FATAL: Uncaught Exception at startup:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('FATAL: Unhandled Rejection at startup:', reason);
});

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const config = require('./config');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { generalRateLimiter } = require('./middleware/rateLimiter');

console.log('Starting WrapIQ API...');
console.log('Environment:', config.nodeEnv);
console.log('Port:', config.apiEndpointPort);

const app = express();

app.use(helmet());
app.use(cors({
  origin: config.cors.origin,
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev'));
app.use(generalRateLimiter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '6.0.0' });
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.get('/', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'WrapIQ API', version: '6.0.0' });
});

app.use('/api', (req, res, next) => {
  try {
    const routes = require('./routes');
    routes(req, res, next);
  } catch (err) {
    console.error('Error loading routes:', err);
    next(err);
  }
});

app.use(notFoundHandler);
app.use(errorHandler);

const port = config.apiEndpointPort;
const host = '0.0.0.0';

const server = app.listen(port, host, () => {
  console.log(`WrapIQ API v6.0.0 running on http://${host}:${port} (${config.nodeEnv})`);
});

server.on('error', (err) => {
  console.error('Server error:', err);
  process.exit(1);
});
