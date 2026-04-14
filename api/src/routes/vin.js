const { Router } = require('express');
const { getVinInfo, getPlateInfo } = require('../controllers/vinController');
const { authenticateToken } = require('../middleware/auth');

const router = Router();

router.use(authenticateToken);

router.get('/:vin', getVinInfo);
router.get('/plate/:state/:plate', getPlateInfo);

module.exports = router;
