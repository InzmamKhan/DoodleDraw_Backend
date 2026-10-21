const express = require('express');
const router = express.Router();
const {
  signup,
  login,
  getCurrentUser,
  logout,
} = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/signup', signup);
router.post('/login', login);
router.get('/me', verifyToken, getCurrentUser);
router.post('/logout', logout);

module.exports = router;