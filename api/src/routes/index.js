const { Router } = require('express');

const router = Router();

router.use('/auth', require('./auth'));
router.use('/estimates', require('./estimates'));
router.use('/clients', require('./clients'));
router.use('/settings', require('./settings'));
router.use('/film', require('./film'));
router.use('/vision', require('./vision'));
router.use('/ai', require('./ai'));
router.use('/intake', require('./intake'));
router.use('/upsells', require('./upsells'));
router.use('/search', require('./search'));
router.use('/vehicle', require('./vehicle'));
router.use('/materials', require('./materials'));
router.use('/packages', require('./packages'));
router.use('/', require('./vin'));
router.use('/export', require('./export'));

module.exports = router;
