const Room = require('../models/Room');

const activeRooms = new Map();
const roomTeardownTimers = new Map();

const handleRoomEvents = (io, socket) => {
  socket.on('join_room', async ({ roomCode, userId, username }) => {
    try {
      if (!roomCode) return;

      const upperCode = roomCode.toUpperCase();
      const room = await Room.findOne({ code: upperCode });

      if (!room) {
        return socket.emit('error_message', 'Room does not exist or has ended.');
      }

      // 1. Initialize Active Room
      if (!activeRooms.has(upperCode)) {
        activeRooms.set(upperCode, {
          roomId: room.id,
          // Convert MongoDB ObjectId to clean string representation
          hostUserId: room.created_by ? room.created_by.toString() : null,
          users: new Map(),
          canvasState: [],
        });
      }

      const activeRoom = activeRooms.get(upperCode);

      // 2. Cancel any pending teardown timer immediately when anyone joins
      if (roomTeardownTimers.has(upperCode)) {
        clearTimeout(roomTeardownTimers.get(upperCode));
        roomTeardownTimers.delete(upperCode);
        io.to(upperCode).emit('teardown_cancelled', 'User active. Teardown cancelled.');
      }

      // 3. User Capacity Check
      if (activeRoom.users.size >= 5 && !activeRoom.users.has(socket.id)) {
        return socket.emit('room_full', 'Room limit reached (Max 5 users).');
      }

      // 4. Attach User to Room Session
      const cleanUserId = userId ? userId.toString() : socket.id;
      activeRoom.users.set(socket.id, {
        userId: cleanUserId,
        username: username || 'Anonymous',
      });

      socket.join(upperCode);
      socket.roomCode = upperCode;
      socket.userId = cleanUserId;

      // 5. Emit User List & Canvas State
      const userList = Array.from(activeRoom.users.values());
      io.to(upperCode).emit('user_joined', {
        users: userList,
        joinedUser: username || 'Anonymous',
      });

      socket.emit('init_canvas_state', activeRoom.canvasState);
    } catch (error) {
      console.error('Join Room Socket Error:', error);
      socket.emit('error_message', 'Failed to join room.');
    }
  });

  socket.on('leave_room', () => {
    handleUserDisconnect(io, socket);
  });

  socket.on('disconnect', () => {
    handleUserDisconnect(io, socket);
  });
};

const handleUserDisconnect = (io, socket) => {
  const roomCode = socket.roomCode;
  if (!roomCode || !activeRooms.has(roomCode)) return;

  const activeRoom = activeRooms.get(roomCode);
  const leavingUser = activeRoom.users.get(socket.id);

  if (!leavingUser) return;

  activeRoom.users.delete(socket.id);
  socket.leave(roomCode);

  io.to(roomCode).emit('user_left', {
    userId: leavingUser.userId,
    username: leavingUser.username,
    users: Array.from(activeRoom.users.values()),
  });

  if (activeRoom.users.size === 0) {
    if (!roomTeardownTimers.has(roomCode)) {
      const timer = setTimeout(() => {
        if (activeRooms.has(roomCode) && activeRooms.get(roomCode).users.size === 0) {
          io.to(roomCode).emit('room_destroyed', 'Room closed due to inactivity.');
          io.in(roomCode).socketsLeave(roomCode);

          activeRooms.delete(roomCode);
        }
        roomTeardownTimers.delete(roomCode);
      }, 10000); 

      roomTeardownTimers.set(roomCode, timer);
    }
  }
};

module.exports = {
  handleRoomEvents,
  activeRooms,
};