const express = require('express');
const router = express.Router();
const {
  createRoom,
  getPublicRooms,
  joinRoom,
  getRoomByCode,
} = require('../controllers/roomController');
const authMiddleware = require('../middleware/authMiddleware');

// Public routes
router.get('/public', getPublicRooms);
router.get('/:code', getRoomByCode);

// Protected routes (require authentication)
router.post('/create', authMiddleware, createRoom);
router.post('/join', authMiddleware, joinRoom);

module.exports = router;