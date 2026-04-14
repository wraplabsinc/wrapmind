const { Router } = require('express');
const { listClients, createClient, getClient, updateClient } = require('../controllers/clientsController');
const { authenticateToken } = require('../middleware/auth');

const router = Router();

router.use(authenticateToken);

router.get('/', listClients);
router.post('/', createClient);
router.get('/:id', getClient);
router.patch('/:id', updateClient);

module.exports = router;
