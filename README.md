# 🚀 DoodleDraw.io — Backend API

The high-performance, real-time backend server powering **DoodleDraw.io**. Built with **Node.js**, **Express**, **MongoDB**, and **Socket.io**, this service manages RESTful authentication, room state lifecycle, database persistence, and WebSocket broadcasting for real-time collaborative canvas sessions.

## ✨ Features

* **🔐 User Authentication:** Secure signup, login, and JWT token authentication via HttpOnly cookies.
* **🏠 Room Management:** REST API endpoints to create, join, validate, and retrieve active room instances.
* **⚡ Real-Time Socket Engine:** High-throughput `Socket.io` server handling room event subscriptions, live drawing coordinates, clearing operations, and room chat messaging.
* **🗄️ MongoDB Integration:** Persistent storage for user profiles, hashed passwords (bcrypt), and saved canvas data.
* **🌐 Cross-Origin Resource Sharing (CORS):** Dynamic origin validation configured for production deployments.

## 🛠️ Tech Stack

* **Runtime:** [Node.js](https://nodejs.org/)
* **Framework:** [Express.js](https://expressjs.com/)
* **Real-Time Engine:** [Socket.io](https://socket.io/)
* **Database:** [MongoDB](https://www.mongodb.com/) via [Mongoose ODM](https://mongoosejs.com/)
* **Security & Auth:** [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken), [bcryptjs](https://github.com/dcodeIO/bcrypt.js), [cookie-parser](https://github.com/expressjs/cookie-parser)
* **Deployment:** [Render](https://render.com/)

## 📁 Folder Structure

```
DoodleDraw_Backend/
├── src/
│   ├── config/            # Database connection & server environment setups
│   ├── controllers/       # Route handlers (Auth, Room, User logic)
│   ├── middleware/        # JWT auth protection & error handlers
│   ├── models/             # Mongoose schemas (User, Room, Canvas models)
│   ├── routes/            # Express REST endpoint declarations
│   ├── sockets/           # Socket.io event listeners & emitters
│   └── index.js           # Server initialization & HTTP/WebSocket binding
├── .env.example           # Template for environment configuration
├── package.json           # Server dependencies & launch scripts
└── README.md
```

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed on your machine:

* **Node.js** (v18 or higher)
* **MongoDB** (Local instance or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster)

### Installation & Local Setup

1. **Clone the repository:**

   ```bash
   git clone https://github.com/InzmamKhan/DoodleDraw_Backend.git
   cd DoodleDraw_Backend
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Configure Environment Variables:**

   Create a `.env` file in the root directory:

   ```bash
   cp .env.example .env
   ```

   Fill in the required variables:

   ```env
   PORT=5000
   MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/doodledraw?retryWrites=true&wmajority
   JWT_SECRET=your_jwt_secret_key_here
   CLIENT_URL=http://localhost:5173
   NODE_ENV=development
   ```

4. **Start the development server:**

   ```bash
   npm run dev
   ```

   The server will start on `http://localhost:5000`.

## 📜 Available Scripts

* **`npm start`**: Runs the production Node.js server.
* **`npm run dev`**: Launches the server using `nodemon` for auto-reloading on changes.

## 📡 API Endpoints Summary

### Auth Routes (`/api/auth`)
* `POST /api/auth/register` - Create a new user account
* `POST /api/auth/login` - Authenticate user & issue JWT cookie
* `POST /api/auth/logout` - Clear user session cookie
* `GET /api/auth/me` - Fetch authenticated user details

### Room Routes (`/api/rooms`)
* `POST /api/rooms/create` - Generate a new drawing room
* `POST /api/rooms/join` - Join an existing room using a code
* `GET /api/rooms/:roomId` - Fetch room state and canvas history

## 🔌 Socket Events

| Event Name | Direction | Description |
| :--- | :--- | :--- |
| `join-room` | Client ➔ Server | User joins a specific socket room |
| `draw-data` | Client ➔ Server ➔ Client | Syncs realtime canvas stroke coordinates |
| `clear-canvas` | Client ➔ Server ➔ Client | Broadcasts canvas clear event to room |
| `send-message` | Client ➔ Server ➔ Client | Relays room chat messages |

## 🌍 Production Environment Variables (Render)

When hosting on platforms like **Render**, set these environment variables in your web service setting:

| Variable | Description |
| :--- | :--- |
| `PORT` | Listening port (assigned automatically by Render or default to `5000`) |
| `MONGO_URI` | Production MongoDB Atlas Connection String |
| `JWT_SECRET` | Strong cryptographic secret key |
| `CLIENT_URL` | Live frontend deployment domain (e.g., `https://doodledrawio.vercel.app`) |
| `NODE_ENV` | Set to `production` |

## 🤝 Contributing

1. Fork the Repository.
2. Create your Feature Branch (`git checkout -b feature/BackendFeature`).
3. Commit your Changes (`git commit -m 'Add new endpoint'`).
4. Push to the Branch (`git push origin feature/BackendFeature`).
5. Open a Pull Request.

## 📄 License

Distributed under the MIT License.