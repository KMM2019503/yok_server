import logger from "../utils/logger";
import { getReceiverSocketId, io } from "../../../socket/Socket";
import prisma from "../../../prisma/prismaClient";

export const sendDMMessageServiceV2 = async (req) => {
  const userId = req.userid;
  const { content, conversationId, receiverId } = req.body;

  try {
    const now = new Date();
    const maxLength = 30;
    let truncatedContent =
      content.length > maxLength
        ? content.slice(0, maxLength) + "..."
        : content;

    const conversation = await getOrCreateConversationV2(
      conversationId,
      userId,
      receiverId
    );

    const data = {
      senderId: userId,
      content,
      conversationId: conversation.id,
      status: {
        status: "SENT",
      },
    };

    const [message, updatedConversation] = await prisma.$transaction([
      prisma.message.create({
        data: data,
        select: {
          id: true,
          content: true,
          status: true,
          createdAt: true,
          messageType: true,
          conversationId: true,
        },
      }),
      prisma.conversation.update({
        where: { id: conversation.id },
        data: {
          lastMessage: {
            content: truncatedContent,
            senderId: userId,
            createdAt: now,
          },
          lastActivity: now,
        },
      }),
    ]);

    emitNewMessage(receiverId, message, updatedConversation);

    return {
      success: true,
      message,
      conversation: updatedConversation,
    };
  } catch (error) {
    throw error;
  }
};

const getOrCreateConversationV2 = async (
  conversationId,
  userId,
  receiverId
) => {
  if (!conversationId) {
    const conversation = await prisma.conversation.create({
      data: {
        members: {
          create: [{ userId }, { userId: receiverId }],
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                userName: true,
                profilePictureUrl: true,
              },
            },
          },
        },
      },
    });

    return conversation;
  } else {
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                userName: true,
                profilePictureUrl: true,
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
  }
};

// emit new message to online users
const emitNewMessage = async (receiverId, message, updatedConversation) => {
  let data = {
    message,
    updatedConversation,
  };
  const receiverSocketId = getReceiverSocketId(receiverId);
  if (receiverSocketId) {
    io.to(receiverSocketId).emit("incomingNewMessage", data, (ack) => {
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

export const sendDmMessageService = async (req) => {
  const userid = req.userid;
  const {
    content,
    conversationId,
    photoUrl = [],
    fileUrls = [],
    receiverId,
    originalMessageId,
  } = req.body;

  const now = new Date();
  const maxLength = 30;
  let truncatedContent =
    content.length > maxLength ? content.slice(0, maxLength) + "..." : content;

  if (photoUrl.length > 0 || fileUrls.length > 0) {
    truncatedContent = "Attachments sent.";
  }

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

        const data = {
          senderId: userid,
          content,
          conversationId: conversation.id,
          photoUrl: photoUrl || [],
          fileUrls: fileUrls || [],
          status: {
            status: "SENT", // Enum value from MessageStatus
            seenUserIds: [], // Initialize as an empty array
          },
        };

        if (originalMessageId) {
          data.references = {
            originalMessageId,
          };
        }

        const message = await prismaClient.message.create({
          data,
          select: {
            id: true,
            content: true,
            photoUrl: true,
            fileUrls: true,
            status: true,
            createdAt: true,
            messageType: true,
            conversationId: true,
            references: true,
            sender: {
              select: {
                id: true,
                userName: true,
                profilePictureUrl: true,
              },
            },
          },
        });

        console.log("🚀 ~ sendDmMessageService ~ conversation Final Updating");
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
          const validPhotoUrls = photoUrl.map((url) => ({
            url,
            messageId: message.id,
            conversationId: conversation.id,
          }));

          if (validPhotoUrls.length > 0) {
            await prismaClient.fileUrls.createMany({
              data: validPhotoUrls,
            });
          }
        });

        // Emit message to receiver
        const emitReturn = await emitNewMessage(receiverId, message);
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
                profilePictureUrl: true,
                fcm: true,
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
                profilePictureUrl: true,
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
              profilePictureUrl: true,
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

export const sendChannelInvitationService = async (req) => {
  const { userid } = req.headers;
  const { phoneNumbers, channelId } = req.body;

  if (!phoneNumbers || phoneNumbers.length === 0) {
    throw new Error("No receivers provided");
  }

  try {
    const now = new Date();

    const receivers = await prisma.user.findMany({
      where: {
        phone: {
          in: phoneNumbers,
        },
      },
      select: {
        id: true,
      },
    });

    const receiverIds = receivers.map((receiver) => receiver.id);

    logger.debug({ receiverIds });

    // Step 1: Iterate over each receiver to find or create conversations
    const messages = await Promise.all(
      receiverIds.map(async (receiverId) => {
        console.log("🚀 ~ Current Receiver Id is :", receiverId);
        // Find or create a conversation for each receiver
        const conversation = await prisma.$transaction(async (prismaClient) => {
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
                      fcm: true,
                    },
                  },
                },
              },
            },
          });

          // If an existing conversation is found, return it
          if (existingConversation) {
            console.log(
              "🚀 ~ conversation ~ existingConversation:",
              existingConversation
            );
            console.log("Conversation found");
            return existingConversation;
          }
          console.log(
            "Conversation not found So We Need to create a new conversation"
          );
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
                    },
                  },
                },
              },
            },
          });
        });

        const channel = await prisma.channel.findUnique({
          where: { id: channelId },
          select: {
            id: true,
            name: true,
            profilePictureUrl: true,
          },
        });

        logger.debug({ channel });

        // Step 2: Create a channel invitation message in the conversation
        const message = await prisma.message.create({
          data: {
            senderId: userid,
            content: `Channel Invitation.`,
            conversationId: conversation.id,
            messageType: "CHANNEL_INVITATION",
            references: {
              channelId: channel.id,
              channelName: channel.name,
              imageUrl: channel.profilePictureUrl,
            },
            status: {
              status: "SENT",
              seenUserIds: [],
            },
          },
          select: {
            id: true,
            content: true,
            createdAt: true,
            conversationId: true,
            sender: {
              select: {
                id: true,
                userName: true,
                profilePictureUrl: true,
              },
            },
            references: true,
            messageType: true,
          },
        });

        await emitNewMessage(receiverId, message);

        console.log("conversation update process start");
        let updateConverstion = await prisma.conversation.update({
          where: { id: conversation.id },
          data: {
            lastMessage: {
              content: "Channel Invitation",
              senderId: userid,
              createdAt: now,
            },
            lastActivity: now,
          },
        });
        console.log(
          "🚀 ~ receiverIds.map ~ updateConverstion:",
          updateConverstion
        );
        console.log("conversation update process end");
        return message;
      })
    );

    return {
      success: true,
    };
  } catch (error) {
    logger.error("Error sending channel invitations:", {
      message: error.message,
      stack: error.stack,
    });
    throw error;
  }
};

export const sendGroupMessageService = async (req) => {
  const { userid } = req.headers;
  const { content, groupId, photoUrl = [], fileUrls = [] } = req.body;

  const now = new Date();
  const maxLength = 30;
  let truncatedContent;

  if (content) {
    truncatedContent =
      content.length > maxLength
        ? content.slice(0, maxLength) + "..."
        : content;
  } else {
    truncatedContent = "Attachments sent.";
  }
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
          messageType: true,
          groupId: true,
          sender: {
            select: {
              id: true,
              userName: true,
              phone: true,
              profilePictureUrl: true,
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

          if (photoUrl.length > 0) {
            await prismaClient.fileUrls.createMany({
              data: photoUrl.map((url) => ({
                url,
                messageId: message.id,
                groupId: message.group.id,
              })),
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

export const sendChannelMessageService = async (req) => {
  const { userid } = req.headers;
  const { content, channelId, photoUrl = [], fileUrls = [] } = req.body;
  console.log("🚀 ~ sendChannelMessageService ~ photoUrl:", photoUrl);

  const now = new Date();
  const maxLength = 30;
  let truncatedContent;

  if (content) {
    truncatedContent =
      content.length > maxLength
        ? content.slice(0, maxLength) + "..."
        : content;
  } else {
    truncatedContent = "Attachments sent.";
  }

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
          status: {
            status: "SENT",
            seenUserIds: [],
          },
        },
        select: {
          id: true,
          content: true,
          photoUrl: true,
          fileUrls: true,
          status: true,
          createdAt: true,
          channelId: true,
          messageType: true,
          sender: {
            select: {
              id: true,
              userName: true,
              phone: true,
              profilePictureUrl: true,
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

          console.log("here");
          console.log("🚀 ~ awaitprisma.$transaction ~ photoUrl:", photoUrl);
          if (photoUrl.length > 0) {
            await prismaClient.fileUrls.createMany({
              data: photoUrl.map((url) => ({
                url,
                messageId: message.id,
                channelId: message.channel.id,
              })),
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

export const sendChannelMessageCommentService = async (req) => {
  const { userid } = req.headers;
  const { content, messageId } = req.body;

  if (!userid && !content && !messageId) {
    throw new Error(
      "Missing userid or content or message id from request body"
    );
  }

  try {
    // Step 1: Create comment and fetch related message
    const { comment } = await prisma.$transaction(async (prismaClient) => {
      console.log("Channel comment creation start");

      const comment = await prismaClient.comment.create({
        data: {
          content,
          createdById: userid,
          messageId,
        },
        select: {
          id: true,
          content: true,
          createdAt: true,
          createdBy: {
            select: {
              id: true,
              userName: true,
              phone: true,
              profilePictureUrl: true,
            },
          },
          message: {
            select: {
              id: true,
              channelId: true,
            },
          },
        },
      });

      return { comment };
    });

    const response = {
      success: true,
      comment,
    };

    // Step 2: Emit the new comment to all channel members
    (async () => {
      try {
        await emitNewChannelComment(comment.message.channelId, comment);
      } catch (error) {
        logger.error("Error in post-channel-comment processing tasks:", {
          message: error.message,
          stack: error.stack,
        });
      }
    })();

    return response;
  } catch (error) {
    logger.error("Error sending channel comment:", {
      message: error.message,
      stack: error.stack,
    });
    throw new Error(error.message);
  }
};

// Emit comment to channel members
const emitNewChannelComment = async (channelId, comment) => {
  io.to(channelId).emit("newChannelComment", comment);
};

const emitNewGroupMessage = async (roomId, message) => {
  io.to(roomId).emit("newGroupMessage", message);
};

const emitNewChannelMessage = async (roomId, message) => {
  io.to(roomId).emit("newChannelMessage", message);
};

// Sending Notifications to offline users
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
