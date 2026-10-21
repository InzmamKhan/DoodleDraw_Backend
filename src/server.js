const http = require('http');
const app = require('./app');
const initSocket = require('./sockets/socketManager');
const connectDB = require('./config/db');
require('dotenv').config();

const PORT = process.env.PORT || 5000;

connectDB();

const server = http.createServer(app);

initSocket(server);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});