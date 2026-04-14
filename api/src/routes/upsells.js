const { Router } = require('express');
const { getUpsellAnalytics, updateUpsell } = require('../controllers/upsellsController');
const { authenticateToken } = require('../middleware/auth');

const router = Router();

router.use(authenticateToken);

router.get('/analytics', getUpsellAnalytics);
router.patch('/:id', updateUpsell);

module.exports = router;
