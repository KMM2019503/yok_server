import { Server } from "socket.io";
import http from "http";
import express from "express";
import logger from "../src/v1/utils/logger";

const app = express();
const server = http.createServer(app);
const onlineUsers = {}; // Object to store online users

// Function to get receiver socket ID
export const getReceiverSocketId = (recId) => {
  return onlineUsers[recId];
};

// Initialize socket.io server
const io = new Server(server, {
  cors: {
    origin: ["*"], // Allow requests from this origin
    methods: ["GET", "POST"],
  },
});

logger.info("WebSocket server started");

// Handle incoming socket connections
io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId; // Get user ID from the connection

  if (userId && userId !== "undefined") {
    onlineUsers[userId] = socket.id; // Store the socket ID associated with the user ID
    logger.info(`User connected: ${socket.id}, User ID: ${userId}`);
    io.emit("pullOnlineUsers", Object.keys(onlineUsers)); // Notify all clients about the updated list of online users
  } else {
    logger.warn("User ID is undefined or invalid.");
  }

  // Handle user disconnection
  socket.on("disconnect", () => {
    logger.info(`User disconnected: ${socket.id}`);
    if (userId && onlineUsers[userId]) {
      delete onlineUsers[userId]; // Remove the user from the online users list
      io.emit("pullOnlineUsers", Object.keys(onlineUsers)); // Notify all clients about the updated list of online users
    }
  });
});

// Export app and server for use in other modules
export { app, server, io };
