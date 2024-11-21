// message.services.js
import { PrismaClient } from "@prisma/client";
import logger from "../utils/logger";
import { getReceiverSocketId, io } from "../../../socket/Socket";
import { retryWithBackoff } from "../utils/helper";

const prisma = new PrismaClient();

export const sendDmMessageService = async (req) => {
  const { userid } = req.headers;
  const { content, conversationId, photoUrl, fileUrls, receiverId } = req.body;

  const now = new Date();
  const maxLength = 30;
  const truncatedContent =
    content.length > maxLength ? content.slice(0, maxLength) + "..." : content;

  try {
    const result = await retryWithBackoff(
      async () => {
        return await prisma.$transaction(async (prisma) => {
          const conversation = await getOrCreateConversation(
            prisma,
            conversationId,
            userid,
            receiverId
          );

          const messageData = {
            senderId: userid,
            content,
            conversationId: conversation.id,
            photoUrl: photoUrl || [],
            fileUrls: fileUrls || [],
            status: "SENT",
          };

          // Save the message and update conversation data concurrently
          const [message] = await Promise.all([
            prisma.message.create({
              data: messageData,
              select: {
                id: true,
                content: true,
                photoUrl: true,
                fileUrls: true,
                status: true,
                createdAt: true,
                conversationId: true,
                sender: {
                  select: {
                    id: true,
                    userName: true,
                    phone: true,
                    profilePictureUrl: true,
                    firebaseUserId: true,
                  },
                },
              },
            }),
            prisma.conversation.update({
              where: { id: conversation.id },
              data: {
                lastMessage: {
                  content: truncatedContent,
                  senderId: userid,
                  createdAt: now,
                },
                lastActivity: now,
              },
            }),
          ]);

          return { conversation, message };
        });
      },
      4,
      500
    ); // retry up to 3 times with a 500ms starting delay

    console.log("🚀 ~ sendDmMessageService ~ result:", result);

    await emitNewMessage(receiverId, result.message);

    return {
      success: true,
      message: result.message,
    };
  } catch (error) {
    logger.error("Error sending DM message:", {
      message: error.message,
      stack: error.stack,
    });
    throw new Error(error.message);
  }
};

// Helper function to get or create a conversation
const getOrCreateConversation = async (
  prisma,
  conversationId,
  userid,
  receiverId
) => {
  if (!conversationId) {
    return await prisma.conversation.create({
      data: {
        members: {
          create: [{ userId: userid }, { userId: receiverId }],
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                userName: true,
                phone: true,
                profilePictureUrl: true,
                firebaseUserId: true,
              },
            },
          },
        },
      },
    });
  }

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    include: {
      members: {
        include: {
          user: {
            select: {
              id: true,
              userName: true,
              phone: true,
              profilePictureUrl: true,
              firebaseUserId: true,
            },
          },
        },
      },
    },
  });
  if (!conversation) {
    throw new Error("Conversation not found");
  }

  return conversation;
};

// Helper function to emit the new message
const emitNewMessage = async (receiverId, message) => {
  const receiverSocketId = getReceiverSocketId(receiverId);
  if (receiverSocketId) {
    io.to(receiverSocketId).emit("newMessage", message, (ack) => {
      if (!ack) {
        logger.error(
          "Socket emit acknowledgment failed, recipient might be disconnected"
        );
      }
    });
  } else {
    logger.info("Receiver socket ID not found, message not emitted");
  }
};

export const sendGroupMessageService = async (req) => {
  const { userid } = req.headers;
  const { content, groupId, photoUrl, fileUrls } = req.body;

  const now = new Date();
  const maxLength = 30;
  const truncatedContent =
    content.length > maxLength ? content.slice(0, maxLength) + "..." : content;

  try {
    const result = await retryWithBackoff(
      async () => {
        return await prisma.$transaction(async (prisma) => {
          const group = await prisma.group.findUnique({
            where: { id: groupId },
            include: {
              members: {
                include: {
                  user: {
                    select: {
                      id: true,
                      firebaseUserId: true,
                    },
                  },
                },
              },
            },
          });

          if (!group) {
            throw new Error("Group not found");
          }

          const messageData = {
            senderId: userid,
            content,
            groupId: group.id,
            photoUrl: photoUrl || [],
            fileUrls: fileUrls || [],
            status: "SENT",
          };

          // Save the message and update group data concurrently
          const [message] = await Promise.all([
            prisma.message.create({
              data: messageData,
              select: {
                id: true,
                content: true,
                photoUrl: true,
                fileUrls: true,
                status: true,
                createdAt: true,
                groupId: true,
                sender: {
                  select: {
                    id: true,
                    userName: true,
                    phone: true,
                    profilePictureUrl: true,
                    firebaseUserId: true,
                  },
                },
              },
            }),
            prisma.group.update({
              where: { id: group.id },
              data: {
                lastMessage: {
                  content: truncatedContent,
                  senderId: userid,
                  createdAt: now,
                },
                lastActivity: now,
              },
            }),
          ]);
          const offlineMembers = group.members.filter((member) => {
            return !getReceiverSocketId(member.user.id);
          });
          return { group, message, offlineMembers };
        });
      },
      4,
      500
    );

    console.log("🚀 ~ sendGroupMessageService ~ result:", result);

    await emitNewGroupMessage(result.group.id, result.message);

    // Generate Notification

    return {
      success: true,
      message: result.message,
    };
  } catch (error) {
    logger.error("Error sending group message:", {
      message: error.message,
      stack: error.stack,
    });
    throw new Error(error.message);
  }
};

// Helper function to emit the new group message to all members
const emitNewGroupMessage = async (roomId, message) => {
  // io.to(roomId).emit("newGroupMessage", message, (ack) => {
  //   if (!ack) {
  //     logger.error(
  //       "Socket emit acknowledgment failed, some recipients might be disconnected"
  //     );
  //   }
  // });
  io.to(roomId).emit("newGroupMessage", message);
};

export const sendChannelMessageService = async (req) => {
  const { userid } = req.headers;
  const { content, channelId, photoUrl, fileUrls } = req.body;

  const now = new Date();
  const maxLength = 30;
  const truncatedContent =
    content.length > maxLength ? content.slice(0, maxLength) + "..." : content;

  try {
    const result = await retryWithBackoff(
      async () => {
        return await prisma.$transaction(async (prisma) => {
          const channel = await prisma.channel.findUnique({
            where: { id: channelId },
            include: {
              members: {
                include: {
                  user: {
                    select: {
                      id: true,
                      firebaseUserId: true,
                    },
                  },
                },
              },
            },
          });

          if (!channel) {
            throw new Error("Channel not found");
          }

          const messageData = {
            senderId: userid,
            content,
            channelId: channel.id,
            photoUrl: photoUrl || [],
            fileUrls: fileUrls || [],
            status: "SENT",
          };

          // Save the message and update channel data concurrently
          const [message] = await Promise.all([
            prisma.message.create({
              data: messageData,
              select: {
                id: true,
                content: true,
                photoUrl: true,
                fileUrls: true,
                status: true,
                createdAt: true,
                channelId: true,
                sender: {
                  select: {
                    id: true,
                    userName: true,
                    phone: true,
                    profilePictureUrl: true,
                    firebaseUserId: true,
                  },
                },
              },
            }),
            prisma.channel.update({
              where: { id: channel.id },
              data: {
                lastMessage: {
                  content: truncatedContent,
                  senderId: userid,
                  createdAt: now,
                },
                lastActivity: now,
              },
            }),
          ]);

          // Identify offline members
          const offlineMembers = channel.members.filter((member) => {
            return !getReceiverSocketId(member.user.id);
          });

          return { channel, message, offlineMembers };
        });
      },
      4,
      500
    );

    console.log("🚀 ~ sendChannelMessageService ~ result:", result);

    await emitNewChannelMessage(result.channel.id, result.message);

    // Generate notifications for offline members
    generateOfflineNotifications(
      result.channel.id,
      result.offlineMembers,
      result.message
    );

    return {
      success: true,
      message: result.message,
    };
  } catch (error) {
    logger.error("Error sending channel message:", {
      message: error.message,
      stack: error.stack,
    });
    throw new Error(error.message);
  }
};

// Helper function to emit the new channel message to all members
const emitNewChannelMessage = async (roomId, message) => {
  io.to(roomId).emit("newChannelMessage", message);
};

// Helper function to generate notifications for offline users
const generateOfflineNotifications = async (
  channelId,
  offlineMembers,
  message
) => {
  try {
    for (const member of offlineMembers) {
      await createNotification({
        userId: member.user.id,
        type: "CHANNEL_MESSAGE",
        referenceId: channelId,
        content: `New message in channel: "${message.content}"`,
        createdAt: new Date(),
      });
    }
  } catch (error) {
    logger.error("Error generating offline notifications:", error);
  }
};
