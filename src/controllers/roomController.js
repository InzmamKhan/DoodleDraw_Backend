const db = require('../config/db');
const { hashPassword, comparePassword } = require('../utils/passwordHasher');
const { generateRoomCode, generateAutoPassword } = require('../utils/codeGenerator');

const createRoom = async (req, res) => {
  const { roomName, customPassword, autoGeneratePassword } = req.body;
  const hostUserId = req.user.id;

  if (!roomName) {
    return res.status(400).json({ message: 'Room name is required.' });
  }

  let plainPassword = null;
  if (autoGeneratePassword) {
    plainPassword = generateAutoPassword();
  } else if (customPassword) {
    plainPassword = customPassword;
  }

  try {
    let roomCode = generateRoomCode();
    let codeExists = await db.query('SELECT id FROM rooms WHERE room_code = $1', [roomCode]);

    while (codeExists.rows.length > 0) {
      roomCode = generateRoomCode();
      codeExists = await db.query('SELECT id FROM rooms WHERE room_code = $1', [roomCode]);
    }

    const hashedPassword = plainPassword ? await hashPassword(plainPassword) : null;

    const newRoom = await db.query(
      'INSERT INTO rooms (room_code, room_name, password_hash, host_user_id) VALUES ($1, $2, $3, $4) RETURNING id, room_code, room_name, created_at, is_active',
      [roomCode, roomName, hashedPassword, hostUserId]
    );

    const room = newRoom.rows[0];

    return res.status(201).json({
      room: {
        id: room.id,
        roomCode: room.room_code,
        roomName: room.room_name,
        hasPassword: Boolean(hashedPassword),
        plainPassword: plainPassword,
        hostUserId: hostUserId,
        createdAt: room.created_at,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error creating room.' });
  }
};

const verifyRoomAccess = async (req, res) => {
  const { roomCode, password } = req.body;

  if (!roomCode) {
    return res.status(400).json({ message: 'Room code is required.' });
  }

  try {
    const roomResult = await db.query('SELECT * FROM rooms WHERE room_code = $1 AND is_active = TRUE', [roomCode]);

    if (roomResult.rows.length === 0) {
      return res.status(404).json({ message: 'Room not found or inactive.' });
    }

    const room = roomResult.rows[0];

    if (room.password_hash) {
      if (!password) {
        return res.status(401).json({ message: 'Password required for this room.', requiresPassword: true });
      }

      const isPasswordValid = await comparePassword(password, room.password_hash);
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Incorrect room password.', requiresPassword: true });
      }
    }

    return res.status(200).json({
      success: true,
      room: {
        id: room.id,
        roomCode: room.room_code,
        roomName: room.room_name,
        hostUserId: room.host_user_id,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error verifying room access.' });
  }
};

const getRoomDetails = async (req, res) => {
  const { roomCode } = req.params;

  try {
    const roomResult = await db.query(
      `SELECT r.id, r.room_code, r.room_name, r.host_user_id, r.is_active, r.password_hash, u.username as host_name 
       FROM rooms r 
       LEFT JOIN users u ON r.host_user_id = u.id 
       WHERE r.room_code = $1 AND r.is_active = TRUE`,
      [roomCode]
    );

    if (roomResult.rows.length === 0) {
      return res.status(404).json({ message: 'Room not found or inactive.' });
    }

    const room = roomResult.rows[0];

    return res.status(200).json({
      room: {
        id: room.id,
        roomCode: room.room_code,
        roomName: room.room_name,
        hostUserId: room.host_user_id,
        hostName: room.host_name,
        hasPassword: Boolean(room.password_hash),
      },
    });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error fetching room details.' });
  }
};

module.exports = {
  createRoom,
  verifyRoomAccess,
  getRoomDetails,
};