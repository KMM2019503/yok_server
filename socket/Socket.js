import { Server } from "socket.io";
import http from "http";
import express from "express";
import logger from "../src/v1/utils/logger";
import { PrismaClient } from "@prisma/client";
import { checkToken } from "../src/v1/middlewares/checkAuth"; // Import the checkAuth middleware

const app = express();
const server = http.createServer(app);
const prisma = new PrismaClient();
const onlineUsers = {}; // Object to store online users

// Function to get receiver socket ID
const getReceiverSocketId = (recId) => {
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

// Apply the checkAuth middleware to each incoming connection
// io.use((socket, next) => {
//   checkToken(socket.handshake, {}, next);
// });

// Handle incoming socket connections
io.on("connection", (socket) => {
  logger.info("A new connection attempt detected");
  const userId = socket.handshake.query.userId; // Get user ID from the connection

  if (userId && userId !== "undefined") {
    onlineUsers[userId] = socket.id; // Store the socket ID associated with the user ID
    logger.info(`User connected: ${socket.id}, User ID: ${userId}`);

    // Update user status to ONLINE and set last active time
    prisma.user.update({
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

  // Listen for the "markMessageAsRead" event
  socket.on("markMessageAsRead", async (messageId) => {
    try {
      // Update the message status to 'READ'
      const updatedMessage = await prisma.message.update({
        where: { id: messageId },
        data: { status: "READ" },
      });

      // Notify the receiver if they are online
      const senderScoketId = getReceiverSocketId(updatedMessage.senderId);

      // check if the sender is online
      if (senderScoketId) {
        io.to(senderScoketId).emit("messageStatusUpdated", updatedMessage);
      }

      console.log("sender is offline");
    } catch (error) {
      logger.error("Error updating message status via WebSocket:", error);
    }
  });

  socket.on("testing", (data) => {
    console.log("🚀 ~ socket.on ~ testing ~data:", data);
  });

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
export { app, server, io, getReceiverSocketId };
