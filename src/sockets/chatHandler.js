const handleChatEvents = (io, socket) => {
  socket.on('send_message', ({ message, username }) => {
    const roomCode = socket.roomCode;
    if (!roomCode) return;

    const chatPayload = {
      id: Date.now().toString(),
      username,
      message,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    io.to(roomCode).emit('receive_message', chatPayload);
  });
};

module.exports = handleChatEvents;