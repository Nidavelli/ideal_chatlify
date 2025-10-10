import express from "express";
import path from "path";
import cors from "cors";

import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";

// Redis adapter is a middleware for Socket.IO that allows
// multiple server instances to share and sync events using Redis.
// This is crucial for distributed systems where you have multiple servers
// and want messages sent on one server to be received by clients connected to others.
import redisAdapter from "socket.io-redis";

import dotenv from "dotenv";
dotenv.config();

import cookieParser from "cookie-parser";

import { log } from "./utils/logger.util.js";

import { initDB } from "../database/database.js";

import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";

const app = express();
const __dirname = path.resolve();

app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));

// API routes for authentication and messages
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

// Serve frontend files if in production mode
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/dist/index.html"));
  });
}

// The port the server listens on, set via environment variable or default 3000
const PORT = process.env.PORT || 3000;

// Create an HTTP server instance based on the Express app
const server = createServer(app);

// Initialize Socket.IO server, attached to our HTTP server
// Socket.IO enables real-time bidirectional communication between clients and servers
const io = new SocketIOServer(server, {
  cors: {
    // Allow requests from the frontend client URL (set in .env)
    origin: [process.env.CLIENT_URL],
    credentials: true,
  },
});

// Set up Redis adapter for Socket.IO to enable distributed event syncing
// When multiple server instances are running, the Redis adapter ensures
// that events (like chat messages) are propagated across all instances,
// so clients connected to any server receive the same events.
io.adapter(
  redisAdapter({
    host: process.env.REDIS_HOST || "localhost", // Redis server hostname
    port: Number(process.env.REDIS_PORT) || 6379, // Redis server port (default Redis port)
  })
);

// Socket.IO connection handler: runs whenever a client connects via WebSocket
io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  // Listen for 'chat message' events sent by clients
  socket.on("chat message", (msg) => {
    console.log(`Message received from ${socket.id}:`, msg);

    // Broadcast the message to all connected clients across all server nodes
    // thanks to Redis adapter syncing events between servers.
    io.emit("chat message", msg);
  });

  // Optional: handle client disconnect event
  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

// Export io if you want to use it elsewhere (e.g., in API controllers)
export { io };

// Initialize the database, then start the HTTP and Socket.IO server
initDB()
  .then(() => {
    try {
      server.listen(PORT, () => {
        log.success(`Server running on port ${PORT}`, "SERVER");
      });
    } catch (error) {
      log.error("Server failed to start", error);
    }
  })
  .catch((error) => {
    log.error("Database initialization failed", error);
  });

// Redis adapter:
// Socket.IO servers don’t share client info by default. When you have multiple servers (on different ports or machines), messages sent to clients on one server need to be relayed to clients on other servers.
// Redis acts as a central message broker — servers publish events to Redis, and all servers subscribe to those events, keeping clients in sync.

// Multiple server instances:
// You start two or more servers running this code on different ports. Both connect to the same Redis, so they behave like one large system rather than isolated chat servers.

// Event broadcasting:
// Using io.emit() sends the message to all clients connected to all servers.

// Port and environment variables:
// Your .env file controls where your servers listen and where Redis runs. This makes the system flexible and configurable.
