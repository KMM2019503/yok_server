import { Server } from "socket.io";
import http from "http";
import express from "express";
import logger from "../src/v1/utils/logger";
import prisma from "../prisma/prismaClient";
import jwt from "jsonwebtoken";
import { deleteUserLocation, updateUserLocation } from "../src/v1/services/location.services";

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
  cookie: true,
});

io.use(async (socket, next) => {
  try {
    const cookieHeader = socket.request.headers.cookie;

    if (!cookieHeader) {
      logger.warn("No cookies found in connection attempt");
      return next(new Error("Authentication required"));
    }
    //* Need to open for frontend *//
    const cookies = cookieHeader.split(";").reduce((acc, cookie) => {
      const [name, value] = cookie.trim().split("=");
      acc[name] = value;
      return acc;
    }, {});

    const token = cookies["token"];

    // * Need to open for postman *//
    // const token = cookieHeader;

    if (!token) {
      logger.warn("No authentication token found in cookies");
      return next(new Error("Authentication token missing"));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

    socket.user = {
      id: decoded.userId,
    };

    logger.info(`Authenticated user ${decoded.userId} connecting`);
    next();
  } catch (error) {
    logger.error(`Authentication failed: ${error.message}`);

    // Handle specific JWT errors
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new Error("Invalid token"));
    }
    if (error instanceof jwt.TokenExpiredError) {
      return next(new Error("Token expired"));
    }

    next(new Error("Authentication error"));
  }
});

io.on("connection", (socket) => {
  logger.info("A new connection attempt detected");
  const userId = socket.user?.id;
  if (!userId) {
    logger.warn("Connection established without user ID");
    return socket.disconnect(true);
  }
  logger.info(`User connected: ${socket.id}, User ID: ${userId}`);
  onlineUsers[userId] = socket.id;

  //catch location updates
  socket.on("updateUserLocation", async (data) => {
    updateUserLocation(socket.user.id, data);
  });

  const sendUserData = async () => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        logger.warn(`User not found for ID: ${userId}`);
        return socket.emit("userData", null);
      }
      console.log('asdfsd');

      const socketId = getReceiverSocketId(userId);
      if (socketId) {
        io.to(socketId).emit("userData", user);
      }
    } catch (error) {
      logger.error("Error fetching user data:", error);
    }
  };

  sendUserData();

  io.emit("pullOnlineUsers", Object.keys(onlineUsers));
  socket.on("pullUserData", sendUserData);

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
    if (userId && onlineUsers[userId]) {
      delete onlineUsers[userId];
      try {
        deleteUserLocation(userId);
        await prisma.user.update({
          where: { id: userId },
          data: {
            lastActiveAt: new Date(),
          },
        });
        io.emit("pullOnlineUsers", Object.keys(onlineUsers));
      } catch (error) {
        logger.error("Error updating user status on disconnect:", error);
      }
    }
  });
});

export { app, server, io, getReceiverSocketId };
