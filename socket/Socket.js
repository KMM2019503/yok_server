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
    io.emit("pullOnlineUsers", Object.keys(onlineUsers)); // Notify all clients about the updated list of online users
  } else {
    logger.warn("User ID is undefined or invalid.");
  }

  socket.on("reconnectUser", async (data) => {
    console.log("🚀 ~ socket.on ~ reconnect user:", data);
    const { userId } = data;

    if (!userId) return;

    try {
      // Fetch user's groups and channels from the database in parallel
      const [userGroups, userChannels] = await Promise.all([
        prisma.group.findMany({
          where: { members: { some: { userId } } },
          select: { id: true },
        }),
        prisma.channel.findMany({
          where: { members: { some: { userId } } },
          select: { id: true },
        }),
      ]);

      console.log("🚀 ~ socket.on ~ userGroups:", userGroups);
      console.log("🚀 ~ socket.on ~ userChannels:", userChannels);

      // Use a Set to avoid duplicate socket joins
      const uniqueIds = new Set();

      userGroups.forEach(({ id }) => uniqueIds.add(id));
      userChannels.forEach(({ id }) => uniqueIds.add(id));

      // Join the socket to all unique group and channel IDs
      uniqueIds.forEach((id) => socket.join(id));

      console.log("Finished joining sockets");
    } catch (error) {
      logger.error(
        "Error fetching user groups or channels on reconnect:",
        error
      );
    }
  });

  socket.on("markMessageAsRead", async ({ messageId, userId }) => {
    try {
      console.log(
        `Message status updating process started at ${new Date(
          Date.now()
        ).toISOString()}`
      );

      const updatedMessage = await prisma.$runCommandRaw({
        findAndModify: "messages",
        query: { _id: { $oid: messageId } },
        update: {
          $addToSet: { "status.seenUserIds": userId },
          $set: { "status.status": "READ" },
        },
        new: true,
      });

      console.log(
        `Message status updating process ended at ${new Date(
          Date.now()
        ).toISOString()}`
      );

      if (updatedMessage.ok === 1) {
        const senderScoketId = getReceiverSocketId(
          updatedMessage.value.senderId.$oid
        );
        if (senderScoketId) {
          io.to(senderScoketId).emit(
            "messageStatusUpdated",
            updatedMessage.value
          );
        }
      }
    } catch (error) {
      logger.error("Error updating message status via WebSocket:", error);
    }
  });

  // Handle user disconnection
  socket.on("disconnect", async () => {
    logger.info(`User disconnected process started at: ${socket.id}`);

    if (userId && onlineUsers[userId]) {
      delete onlineUsers[userId]; // Remove the user from the online users list

      try {
        // Update user status to OFFLINE and lastActiveAt to the current timestamp
        await prisma.user.update({
          where: { id: userId },
          data: {
            lastActiveAt: new Date(),
          },
        });
        logger.info(`User disconnected process finished at: ${socket.id}`);

        io.emit("pullOnlineUsers", Object.keys(onlineUsers)); // Notify all clients about the updated list of online users
      } catch (error) {
        logger.error("Error updating user status on disconnect:", error);
      }
    }
  });
});

// Export app and server for use in other modules
export { app, server, io, getReceiverSocketId };

// Listen for "createGroupRoom" event emitted after group creation
// socket.on("createGroupRoom", ({ groupId, memberIds }) => {
//   const roomName = `group_${groupId}`; // Room name for the group

//   console.log("🚀 ~ socket.on ~ roomName:", roomName);

//   // Add all members to the group room
//   memberIds.forEach((memberId) => {
//     const memberSocketId = getReceiverSocketId(memberId);
//     console.log("🚀 ~ memberIds.forEach ~ memberSocketId:", memberSocketId);

//     if (memberSocketId) {
//       io.sockets.sockets.get(memberSocketId)?.join(roomName);
//       io.to(memberSocketId).emit("joinGroupRoomNoti", {
//         roomName,
//         groupId,
//       });
//     }
//   });

//   socket.emit("joinGroupRoomNoti", {
//     roomName,
//     groupId,
//   });

//   // Notify all members in the room about the new group
//   io.to(roomName).emit("groupCreated", {
//     groupId,
//     message: "A new group has been created.",
//   });

//   logger.info(`Room ${roomName} created and members notified.`);
// });
