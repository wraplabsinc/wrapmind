const { Router } = require('express');
const { calculateFilm, getSupplierSheet } = require('../controllers/filmController');
const { authenticateToken } = require('../middleware/auth');

const router = Router();

router.use(authenticateToken);

router.post('/calculate', calculateFilm);
router.get('/supplier-sheet/:id', getSupplierSheet);

module.exports = router;
