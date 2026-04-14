const { Router } = require('express');
const { generateEstimate } = require('../controllers/aiController');
const { authenticateToken } = require('../middleware/auth');
const { aiRateLimiter } = require('../middleware/rateLimiter');

const router = Router();

router.use(authenticateToken);

router.post('/generate-estimate', aiRateLimiter, generateEstimate);

module.exports = router;
