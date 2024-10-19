import { Server } from "socket.io";
import http from "http";
import express from "express";
import logger from "../src/v1/utils/logger";
import { Prisma } from "@prisma/client";

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
    origin: ["*"],
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

    // Update user status to ONLINE and set last active time
    Prisma.user.update({
      where: { id: userId },
      data: {
        status: "ONLINE",
        lastActiveAt: new Date(),
      },
    });

    io.emit("pullOnlineUsers", Object.keys(onlineUsers)); // Notify all clients about the updated list of online users
  } else {
    logger.warn("User ID is undefined or invalid.");
  }

  // Handle user disconnection
  socket.on("disconnect", () => {
    logger.info(`User disconnected: ${socket.id}`);
    if (userId && onlineUsers[userId]) {
      delete onlineUsers[userId]; // Remove the user from the online users list

      // Update user status to OFFLINE
      prisma.user.update({
        where: { id: userId },
        data: {
          status: "OFFLINE",
        },
      });

      io.emit("pullOnlineUsers", Object.keys(onlineUsers)); // Notify all clients about the updated list of online users
    }
  });
});

// Export app and server for use in other modules
export { app, server, io };
