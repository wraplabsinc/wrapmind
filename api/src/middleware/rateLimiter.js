const rateLimit = require('express-rate-limit');
const config = require('../config');

const aiRateLimiter = rateLimit({
  windowMs: config.rateLimit.aiGeneration.windowMs,
  max: config.rateLimit.aiGeneration.max,
  message: {
    error: 'AI generation rate limit exceeded. Max 60 requests per hour.',
    retryAfter: Math.ceil(config.rateLimit.aiGeneration.windowMs / 1000),
  },
  keyGenerator: (req) => req.user?.id || req.ip,
  standardHeaders: true,
  legacyHeaders: false,
});

const intakeRateLimiter = rateLimit({
  windowMs: config.rateLimit.intakeForm.windowMs,
  max: config.rateLimit.intakeForm.max,
  message: {
    error: 'Too many submissions. Please try again later.',
    retryAfter: Math.ceil(config.rateLimit.intakeForm.windowMs / 1000),
  },
  keyGenerator: (req) => req.ip,
  standardHeaders: true,
  legacyHeaders: false,
});

const generalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { aiRateLimiter, intakeRateLimiter, generalRateLimiter };
