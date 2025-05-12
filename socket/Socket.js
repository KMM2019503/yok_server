import { Server } from "socket.io";
import http from "http";
import express from "express";
import logger from "../src/v1/utils/logger";
import prisma from "../prisma/prismaClient";
import { checkToken } from "../src/v1/middlewares/checkAuth"; // Import the checkAuth middleware

const app = express();
const server = http.createServer(app);
const onlineUsers = {}; // Object to store online users

// Function to get receiver socket ID
const getReceiverSocketId = (recId) => {
  return onlineUsers[recId];
};

// Initialize socket.io server
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
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

  socket.on("markMessagesAsRead", async ({ messageIds, userId, groupId }) => {
    try {
      const startTime = Date.now();
      console.log(
        `Message status updating process started at ${new Date(
          startTime
        ).toISOString()}`
      );

      if (!Array.isArray(messageIds) || messageIds.length === 0) {
        throw new Error("Invalid or missing message IDs.");
      }

      const messages = await prisma.message.findMany({
        where: { id: { in: messageIds } },
        select: {
          id: true,
          status: true,
        },
      });

      const messagesToUpdate = messages.filter(
        ({ status }) => !status.seenUserIds.includes(userId)
      );

      if (messagesToUpdate.length === 0) {
        console.log(
          "No messages need updating. User is already in seenUser Ids."
        );
        return;
      }

      const messageIdsToUpdate = messagesToUpdate.map(({ id }) => id);

      const updatedMessagesCount = await prisma.message.updateMany({
        where: { id: { in: messageIdsToUpdate } },
        data: {
          status: {
            update: {
              seenUserIds: { push: userId },
              status: "READ",
            },
          },
        },
      });

      console.log("🚀 ~ updatedMessagesCount:", updatedMessagesCount);

      const updatedMessages = await prisma.message.findMany({
        where: { id: { in: messageIdsToUpdate } },
        include: { status: true },
      });

      console.log("🚀 ~ updatedMessages:", updatedMessages);
      console.log(
        `Message status updating process ended at ${new Date(
          Date.now()
        ).toISOString()}`
      );

      if (updatedMessages.length > 0) {
        if (groupId) {
          io.to(groupId).emit("groupMessagesStatusUpdated", updatedMessages);
        } else {
          const senderSocketId = getReceiverSocketId(
            updatedMessages[0].senderId
          );
          if (senderSocketId) {
            io.to(senderSocketId).emit(
              "messagesStatusUpdated",
              updatedMessages
            );
          }
        }
      }
    } catch (error) {
      logger.error("Error updating message status via WebSocket:", {
        message: error.message,
        stack: error.stack,
      });
    }
  });

  socket.on(
    "initialMarkMessagesAsRead",
    async ({ conversationId, userId, groupId }) => {
      try {
        const startTime = Date.now();
        console.log("🚀 ~ userId:", userId);
        console.log("🚀 ~ conversationId:", conversationId);
        console.log(
          `Message status updating process started at ${new Date(
            startTime
          ).toISOString()}`
        );

        // Validate input
        if (!userId) {
          throw new Error("Invalid or missing userId.");
        }

        // Fetch messages based on groupId or conversationId
        let messages;
        if (groupId) {
          // Fetch messages for the given group
          messages = await prisma.message.findMany({
            where: { groupId: groupId },
            select: {
              id: true,
              senderId: true, // Include senderId for the comparison
              status: true,
            },
          });
        } else {
          // Fetch messages for the given conversation
          messages = await prisma.message.findMany({
            where: { conversationId: conversationId },
            select: {
              id: true,
              senderId: true, // Include senderId for the comparison
              status: true,
            },
          });
        }

        const messagesToUpdate = messages.filter(
          ({ status, senderId }) =>
            !status.seenUserIds.includes(userId) && senderId !== userId
        );

        if (messagesToUpdate.length === 0) {
          console.log(
            "No messages need updating. User is already in seenUserIds or is the sender."
          );
          return;
        }

        const messageIdsToUpdate = messagesToUpdate.map(({ id }) => id);

        // Update messages' status
        const updatedMessagesCount = await prisma.message.updateMany({
          where: { id: { in: messageIdsToUpdate } },
          data: {
            status: {
              update: {
                seenUserIds: { push: userId },
                status: "READ",
              },
            },
          },
        });

        console.log("🚀 ~ updatedMessagesCount:", updatedMessagesCount);

        // Retrieve the updated messages
        const updatedMessages = await prisma.message.findMany({
          where: { id: { in: messageIdsToUpdate } },
          include: { status: true },
        });

        console.log("🚀 ~ updatedMessages:", updatedMessages);
        console.log(
          `Message status updating process ended at ${new Date(
            Date.now()
          ).toISOString()}`
        );

        // Emit the updated messages to the appropriate socket
        if (updatedMessages.length > 0) {
          if (groupId) {
            io.to(groupId).emit(
              "initialGroupMessagesStatusUpdated",
              updatedMessages
            );
          } else {
            const senderSocketId = getReceiverSocketId(
              updatedMessages[0].senderId
            );
            if (senderSocketId) {
              io.to(senderSocketId).emit(
                "initialMessagesStatusUpdated",
                updatedMessages
              );
            }
          }
        }
      } catch (error) {
        logger.error("Error updating message status via WebSocket:", {
          message: error.message,
          stack: error.stack,
        });
      }
    }
  );

  // Handle user disconnection
  socket.on("disconnect", async () => {
    logger.info(`User disconnected process started at: ${socket.id}`);

    if (userId && onlineUsers[userId]) {
      delete onlineUsers[userId];

      try {
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

export { app, server, io, getReceiverSocketId };
