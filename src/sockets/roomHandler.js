const db = require('../config/db');

const activeRooms = new Map();
const roomTeardownTimers = new Map();

const handleRoomEvents = (io, socket) => {
  socket.on('join_room', async ({ roomCode, userId, username }) => {
    try {
      const roomResult = await db.query('SELECT * FROM rooms WHERE room_code = $1 AND is_active = TRUE', [roomCode]);
      if (roomResult.rows.length === 0) {
        return socket.emit('error_message', 'Room does not exist or has ended.');
      }

      const room = roomResult.rows[0];

      if (!activeRooms.has(roomCode)) {
        activeRooms.set(roomCode, {
          roomId: room.id,
          hostUserId: room.host_user_id,
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

      await db.query(
        `INSERT INTO room_members (room_id, user_id, last_seen_at) 
         VALUES ($1, $2, NOW()) 
         ON CONFLICT (room_id, user_id) 
         DO UPDATE SET last_seen_at = NOW()`,
        [room.id, userId]
      );

      const userList = Array.from(activeRoom.users.values());
      io.to(roomCode).emit('user_joined', {
        users: userList,
        joinedUser: username,
      });

      socket.emit('init_canvas_state', activeRoom.canvasState);
    } catch (error) {
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

        try {
          await db.query('UPDATE rooms SET is_active = FALSE WHERE id = $1', [activeRoom.roomId]);
          if (activeRoom.canvasState.length > 0) {
            await db.query(
              'INSERT INTO canvas_states (room_id, state_data) VALUES ($1, $2)',
              [activeRoom.roomId, JSON.stringify(activeRoom.canvasState)]
            );
          }
        } catch (err) {
          console.error(err);
        }

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