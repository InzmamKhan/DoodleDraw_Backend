const { activeRooms } = require('./roomHandler');

const handleCanvasEvents = (io, socket) => {
  socket.on('draw_stroke', (strokeData) => {
    const roomCode = socket.roomCode;
    if (!roomCode || !activeRooms.has(roomCode)) return;

    const activeRoom = activeRooms.get(roomCode);
    activeRoom.canvasState.push(strokeData);

    socket.to(roomCode).emit('draw_stroke', strokeData);
  });

  socket.on('clear_canvas', () => {
    const roomCode = socket.roomCode;
    if (!roomCode || !activeRooms.has(roomCode)) return;

    const activeRoom = activeRooms.get(roomCode);
    activeRoom.canvasState = [];

    io.to(roomCode).emit('clear_canvas');
  });
};

module.exports = handleCanvasEvents;