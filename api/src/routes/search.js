const { Router } = require('express');
const { search } = require('../controllers/searchController');
const { authenticateToken } = require('../middleware/auth');

const router = Router();

router.use(authenticateToken);

router.get('/', search);

module.exports = router;
