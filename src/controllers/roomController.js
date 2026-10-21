const Room = require('../models/Room');
const User = require('../models/User');
const { hashPassword, comparePassword } = require('../utils/passwordHasher');
const crypto = require('crypto');

const generateRoomCode = () => {
  return crypto.randomBytes(3).toString('hex').toUpperCase();
};

const createRoom = async (req, res) => {
  const { name, isPublic = true, password, securityType = 'public' } = req.body;

  if (!name || name.trim() === '') {
    return res.status(400).json({ message: 'Room name is required.' });
  }

  try {
    let roomCode = generateRoomCode();
    let isUnique = false;
    let attempts = 0;

    // Ensure room code uniqueness
    while (!isUnique && attempts < 10) {
      const existing = await Room.findOne({ code: roomCode });
      if (!existing) {
        isUnique = true;
      } else {
        roomCode = generateRoomCode();
        attempts++;
      }
    }

    let passwordHash = null;
    let autoPassword = null;
    let finalIsPublic = isPublic;

    if (securityType === 'auto') {
      autoPassword = crypto.randomBytes(4).toString('hex');
      passwordHash = await hashPassword(autoPassword);
      finalIsPublic = false;
    } else if (securityType === 'custom' || (!isPublic && password)) {
      if (!password || password.trim() === '') {
        return res.status(400).json({ message: 'Password is required for private rooms.' });
      }
      passwordHash = await hashPassword(password);
      finalIsPublic = false;
    }

    const newRoom = await Room.create({
      name: name.trim(),
      code: roomCode,
      is_public: finalIsPublic,
      password_hash: passwordHash,
      created_by: req.user.id,
    });

    return res.status(201).json({
      message: 'Room created successfully',
      room: {
        id: newRoom.id,
        name: newRoom.name,
        code: newRoom.code,
        is_public: newRoom.is_public,
        created_at: newRoom.created_at,
        autoPassword: autoPassword || undefined,
      },
    });
  } catch (error) {
    console.error('Create Room Error:', error);
    return res.status(500).json({ message: 'Internal server error creating room.' });
  }
};

const getPublicRooms = async (req, res) => {
  try {
    const rooms = await Room.find({ is_public: true })
      .populate('created_by', 'username email')
      .sort({ created_at: -1 })
      .limit(50);

    const formattedRooms = rooms.map((room) => ({
      id: room.id,
      name: room.name,
      code: room.code,
      is_public: room.is_public,
      created_at: room.created_at,
      host: room.created_by ? room.created_by.username : 'Unknown',
    }));

    return res.status(200).json({ rooms: formattedRooms });
  } catch (error) {
    console.error('Get Public Rooms Error:', error);
    return res.status(500).json({ message: 'Internal server error fetching rooms.' });
  }
};

const joinRoom = async (req, res) => {
  const { code, password } = req.body;

  if (!code) {
    return res.status(400).json({ message: 'Room code is required.' });
  }

  try {
    const room = await Room.findOne({ code: code.toUpperCase() }).populate('created_by', 'username');
    if (!room) {
      return res.status(404).json({ message: 'Room not found.' });
    }

    if (!room.is_public && room.password_hash) {
      if (!password) {
        return res.status(401).json({ message: 'Password required for this room.', requiresPassword: true });
      }

      const isMatch = await comparePassword(password, room.password_hash);
      if (!isMatch) {
        return res.status(401).json({ message: 'Invalid room password.' });
      }
    }

    return res.status(200).json({
      message: 'Joined room successfully',
      room: {
        id: room.id,
        name: room.name,
        code: room.code,
        is_public: room.is_public,
        host: room.created_by ? room.created_by.username : 'Unknown',
      },
    });
  } catch (error) {
    console.error('Join Room Error:', error);
    return res.status(500).json({ message: 'Internal server error joining room.' });
  }
};

const getRoomByCode = async (req, res) => {
  const { code } = req.params;

  try {
    const room = await Room.findOne({ code: code.toUpperCase() }).populate('created_by', 'username');
    if (!room) {
      return res.status(404).json({ message: 'Room not found.' });
    }

    return res.status(200).json({
      room: {
        id: room.id,
        name: room.name,
        code: room.code,
        is_public: room.is_public,
        hasPassword: !!room.password_hash,
        host: room.created_by ? room.created_by.username : 'Unknown',
      },
    });
  } catch (error) {
    console.error('Get Room Details Error:', error);
    return res.status(500).json({ message: 'Internal server error fetching room details.' });
  }
};

module.exports = {
  createRoom,
  getPublicRooms,
  joinRoom,
  getRoomByCode,
};