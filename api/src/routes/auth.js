const { Router } = require('express');
const { login, logout, getMe } = require('../controllers/authController');

const router = Router();

router.post('/login', login);
router.post('/logout', logout);
router.get('/me', getMe);

module.exports = router;
