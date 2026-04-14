const { Router } = require('express');
const { exportEstimates } = require('../controllers/exportController');
const { authenticateToken, requireOwner } = require('../middleware/auth');

const router = Router();

router.use(authenticateToken);
router.use(requireOwner);

router.get('/estimates', exportEstimates);

module.exports = router;
