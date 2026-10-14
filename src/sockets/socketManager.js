const { Server } = require('socket.io');
const { handleRoomEvents } = require('./roomHandler');
const handleCanvasEvents = require('./canvasHandler');
const handleChatEvents = require('./chatHandler');

const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    handleRoomEvents(io, socket);
    handleCanvasEvents(io, socket);
    handleChatEvents(io, socket);
  });

  return io;
};

module.exports = initSocket;