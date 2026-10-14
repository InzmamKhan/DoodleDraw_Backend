const express = require('express');
const router = express.Router();
const { createRoom, verifyRoomAccess, getRoomDetails } = require('../controllers/roomController');
const { verifyToken } = require('../middleware/authMiddleware');

router.post('/create', verifyToken, createRoom);
router.post('/verify', verifyToken, verifyRoomAccess);
router.get('/:roomCode', verifyToken, getRoomDetails);

module.exports = router;