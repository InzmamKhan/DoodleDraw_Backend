const express = require('express');
const router = express.Router();
const {
  createRoom,
  getPublicRooms,
  joinRoom,
  getRoomByCode,
} = require('../controllers/roomController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/public', getPublicRooms);
router.get('/:code', getRoomByCode);

router.post('/create', verifyToken, createRoom);
router.post('/join', verifyToken, joinRoom);

module.exports = router;