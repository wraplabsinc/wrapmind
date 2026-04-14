const { Router } = require('express');
const { submitIntake, listLeads, getLead, convertLead, updateLeadStatus } = require('../controllers/intakeController');
const { authenticateToken } = require('../middleware/auth');
const { intakeRateLimiter } = require('../middleware/rateLimiter');

const router = Router();

router.post('/', intakeRateLimiter, submitIntake);

router.use(authenticateToken);

router.get('/leads', listLeads);
router.get('/leads/:id', getLead);
router.post('/leads/:id/convert', convertLead);
router.patch('/leads/:id/status', updateLeadStatus);

module.exports = router;
