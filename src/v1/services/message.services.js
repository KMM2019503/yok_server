// message.services.js
import { PrismaClient } from "@prisma/client";
import logger from "../utils/logger";
import { getReceiverSocketId, io } from "../../../socket/Socket";
import { retryWithBackoff } from "../utils/helper";
import { sendNotification } from "../utils/notifications/noti";

const prisma = new PrismaClient();

export const sendDmMessageService = async (req) => {
  const { userid } = req.headers;
  const { content, conversationId, photoUrl, fileUrls, receiverId } = req.body;

  const now = new Date();
  const maxLength = 30;
  const truncatedContent =
    content.length > maxLength ? content.slice(0, maxLength) + "..." : content;

  try {
    // Step 1: Create message and fetch conversation
    const { message, conversation } = await prisma.$transaction(
      async (prismaClient) => {
        const conversation = await getOrCreateConversation(
          prismaClient,
          conversationId,
          userid,
          receiverId
        );

        logger.debug({ conversation });

        const message = await prismaClient.message.create({
          data: {
            senderId: userid,
            content,
            conversationId: conversation.id,
            photoUrl: photoUrl || [],
            fileUrls: fileUrls || [],
            status: {
              status: "SENT", // Enum value from MessageStatus
              seenUserIds: [], // Initialize as an empty array
            },
          },
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
                profilePictureUrl: true,
                firebaseUserId: true,
              },
            },
          },
        });

        return { message, conversation };
      }
    );

    // Step 2: Immediately return the response
    const response = {
      success: true,
      message,
    };

    // Step 3: Serialize conversation update in background
    (async () => {
      try {
        // Serialize conversation update to prevent race conditions
        await prisma.$transaction(async (prismaClient) => {
          const currentConversation =
            await prismaClient.conversation.findUnique({
              where: { id: conversation.id },
              select: { lastMessage: true },
            });

          if (
            !currentConversation.lastMessage ||
            new Date(currentConversation.lastMessage.createdAt) <=
              new Date(message.createdAt)
          ) {
            await prismaClient.conversation.update({
              where: { id: conversation.id },
              data: {
                lastMessage: {
                  content: truncatedContent,
                  senderId: userid,
                  createdAt: now,
                },
                lastActivity: now,
              },
            });
          }
        });

        // Emit message to receiver
        const emitReturn = await emitNewMessage(receiverId, message);

        if (!emitReturn) {
          // Handle offline user notifications
          const receiver = conversation.members.find(
            (m) => m.user.id === receiverId
          );
          if (receiver) {
            const payload = {
              title: `New Message from ${message.sender.userName}`,
              body: truncatedContent,
              icon: message.sender.profilePictureUrl,
              data: { sender: message.sender.userName },
            };
            await sendNotification([receiver.user.firebaseUserId], payload);
          }
        }
      } catch (error) {
        logger.error("Error in post-message processing tasks:", {
          message: error.message,
          stack: error.stack,
        });
      }
    })();

    return response;
  } catch (error) {
    logger.error("Error sending DM message:", {
      message: error.message,
      stack: error.stack,
    });
    throw error;
  }
};

const getOrCreateConversation = async (
  prisma,
  conversationId,
  userid,
  receiverId
) => {
  if (!conversationId) {
    // Check if a conversation already exists between the sender and receiver
    const existingConversation = await prisma.conversation.findFirst({
      where: {
        members: {
          every: {
            userId: {
              in: [userid, receiverId],
            },
          },
          some: {
            userId: userid,
          },
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

    // If an existing conversation is found, return it
    if (existingConversation) {
      return existingConversation;
    }

    // If no conversation is found, create a new one
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

  // If conversationId is provided, fetch the conversation
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

    return true;
  } else {
    // sending notification if the user is offline
    return false;
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
    // Step 1: Create message and fetch conversation
    const { message } = await prisma.$transaction(async (prismaClient) => {
      console.log("group message creation start");
      const message = await prismaClient.message.create({
        data: {
          senderId: userid,
          content,
          groupId,
          photoUrl: photoUrl || [],
          fileUrls: fileUrls || [],
          status: "SENT",
        },
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
      });

      return { message };
    });

    const response = {
      success: true,
      message,
    };

    // Step 3: Serialize conversation update in background
    (async () => {
      try {
        await prisma.$transaction(async (prismaClient) => {
          const currentGroup = await prismaClient.group.findUnique({
            where: { id: message.groupId },
            select: { lastMessage: true },
          });

          if (
            !currentGroup.lastMessage ||
            new Date(currentGroup.lastMessage.createdAt) <=
              new Date(message.createdAt)
          ) {
            await prismaClient.group.update({
              where: { id: message.groupId },
              data: {
                lastMessage: {
                  content: truncatedContent,
                  senderId: userid,
                  createdAt: now,
                },
                lastActivity: now,
              },
            });
          }
        });

        // Emit message to receiver
        const emitReturn = await emitNewGroupMessage(message.groupId, message);

        // if (!emitReturn) {
        //   // Handle offline user notifications
        //   const receiver = conversation.members.find(
        //     (m) => m.user.id === receiverId
        //   );
        //   if (receiver) {
        //     const payload = {
        //       title: `New Message from ${message.sender.userName}`,
        //       body: truncatedContent,
        //       icon: message.sender.profilePictureUrl,
        //       data: { sender: message.sender.userName },
        //     };
        //     await sendNotification([receiver.user.firebaseUserId], payload);
        //   }
        // }
      } catch (error) {
        logger.error("Error in post-group-message processing tasks:", {
          message: error.message,
          stack: error.stack,
        });
      }
    })();

    return response;
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
    // Step 1: Create message and fetch channel
    const { message } = await prisma.$transaction(async (prismaClient) => {
      console.log("channel message creation start");

      const message = await prismaClient.message.create({
        data: {
          senderId: userid,
          content,
          channelId,
          photoUrl: photoUrl || [],
          fileUrls: fileUrls || [],
          status: "SENT",
        },
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
      });

      return { message };
    });

    const response = {
      success: true,
      message,
    };

    // Step 3: Serialize channel update in background
    (async () => {
      try {
        await prisma.$transaction(async (prismaClient) => {
          const currentChannel = await prismaClient.channel.findUnique({
            where: { id: message.channelId },
            select: { lastMessage: true },
          });

          if (
            !currentChannel.lastMessage ||
            new Date(currentChannel.lastMessage.createdAt) <=
              new Date(message.createdAt)
          ) {
            await prismaClient.channel.update({
              where: { id: message.channelId },
              data: {
                lastMessage: {
                  content: truncatedContent,
                  senderId: userid,
                  createdAt: now,
                },
                lastActivity: now,
              },
            });
          }
        });

        // Emit message to channel members
        await emitNewChannelMessage(message.channelId, message);

        // Additional handling for offline members
        // const channel = await prisma.channel.findUnique({
        //   where: { id: channelId },
        //   include: {
        //     members: {
        //       include: {
        //         user: {
        //           select: {
        //             id: true,
        //             firebaseUserId: true,
        //           },
        //         },
        //       },
        //     },
        //   },
        // });

        // if (channel) {
        //   const offlineMembers = channel.members.filter((member) => {
        //     return !getReceiverSocketId(member.user.id);
        //   });

        //   generateOfflineNotifications(channel.id, offlineMembers, message);
        // }
      } catch (error) {
        logger.error("Error in post-channel-message processing tasks:", {
          message: error.message,
          stack: error.stack,
        });
      }
    })();

    return response;
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

export const sendGroupMessageServiceOld = async (req) => {
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
