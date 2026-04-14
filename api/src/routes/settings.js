const { Router } = require('express');
const { getSettings, updateSettings, syncShopMonkey } = require('../controllers/settingsController');
const { authenticateToken } = require('../middleware/auth');

const router = Router();

router.use(authenticateToken);

router.get('/', getSettings);
router.patch('/', updateSettings);
router.post('/sync-shopmonkey', syncShopMonkey);

module.exports = router;
