const config = require('../config');

function requireApiKey(req, res, next) {
  const key = req.headers['x-api-key'];

  if (!key) {
    return res.status(401).json({ error: 'API key required' });
  }

  if (key !== config.apiKey) {
    return res.status(403).json({ error: 'Invalid API key' });
  }

  next();
}

module.exports = { requireApiKey };
