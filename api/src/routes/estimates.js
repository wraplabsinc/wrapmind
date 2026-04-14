const { Router } = require('express');
const {
  listEstimates,
  getEstimate,
  generateEstimate,
  createEstimate,
  updateEstimate,
  deleteEstimate,
  pushShopMonkey,
  getEstimatePdf,
  approveEstimate,
  getEstimateNotes,
  createEstimateNote,
} = require('../controllers/estimatesController');
const { authenticateToken } = require('../middleware/auth');
const { aiRateLimiter } = require('../middleware/rateLimiter');

const router = Router();

router.post('/:id/approve', approveEstimate);

router.use(authenticateToken);

router.get('/', listEstimates);
router.get('/:id', getEstimate);
router.post('/generate', aiRateLimiter, generateEstimate);
router.post('/', createEstimate);
router.patch('/:id', updateEstimate);
router.delete('/:id', deleteEstimate);
router.post('/:id/push-shopmonkey', pushShopMonkey);
router.get('/:id/pdf', getEstimatePdf);
router.get('/:id/notes', getEstimateNotes);
router.post('/:id/notes', createEstimateNote);

module.exports = router;
