const Room = require('../models/Room');

const activeRooms = new Map();
const roomTeardownTimers = new Map();

const handleRoomEvents = (io, socket) => {
  socket.on('join_room', async ({ roomCode, userId, username }) => {
    try {
      // Find room in MongoDB
      const room = await Room.findOne({ code: roomCode.toUpperCase() });
      if (!room) {
        return socket.emit('error_message', 'Room does not exist or has ended.');
      }

      if (!activeRooms.has(roomCode)) {
        activeRooms.set(roomCode, {
          roomId: room.id,
          hostUserId: room.created_by ? room.created_by.toString() : null,
          users: new Map(),
          canvasState: [],
        });
      }

      const activeRoom = activeRooms.get(roomCode);

      if (activeRoom.users.size >= 5 && !activeRoom.users.has(socket.id)) {
        return socket.emit('room_full', 'Room limit reached (Max 5 users).');
      }

      if (roomTeardownTimers.has(roomCode)) {
        clearTimeout(roomTeardownTimers.get(roomCode));
        roomTeardownTimers.delete(roomCode);
        io.to(roomCode).emit('teardown_cancelled', 'Host or user reconnected. Room active.');
      }

      activeRoom.users.set(socket.id, { userId, username });
      socket.join(roomCode);
      socket.roomCode = roomCode;
      socket.userId = userId;

      const userList = Array.from(activeRoom.users.values());
      io.to(roomCode).emit('user_joined', {
        users: userList,
        joinedUser: username,
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
  activeRoom.users.delete(socket.id);
  socket.leave(roomCode);

  if (leavingUser) {
    io.to(roomCode).emit('user_left', {
      userId: leavingUser.userId,
      username: leavingUser.username,
      users: Array.from(activeRoom.users.values()),
    });
  }

  const isHost = leavingUser && leavingUser.userId === activeRoom.hostUserId;
  const isRoomEmpty = activeRoom.users.size === 0;

  if (isHost || isRoomEmpty) {
    if (!roomTeardownTimers.has(roomCode)) {
      io.to(roomCode).emit('teardown_warning', {
        message: isHost ? 'Host left. Room destroying in 10 seconds.' : 'Room empty. Destroying in 10 seconds.',
        countdown: 10,
      });

      const timer = setTimeout(async () => {
        io.to(roomCode).emit('room_destroyed', 'Room closed.');
        io.in(roomCode).socketsLeave(roomCode);

        activeRooms.delete(roomCode);
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