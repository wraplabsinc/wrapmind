const { Router } = require('express');
const { analyzeVision } = require('../controllers/visionController');
const { authenticateToken } = require('../middleware/auth');

const router = Router();

router.use(authenticateToken);

router.post('/analyze', analyzeVision);

module.exports = router;
