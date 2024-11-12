// message.services.js
import { PrismaClient } from "@prisma/client";
import logger from "../utils/logger";
import { getReceiverSocketId, io } from "../../../socket/Socket";
import { retryWithBackoff } from "../utils/helper";

const prisma = new PrismaClient();

// export const sendDmMessageService = async (req) => {
//   logger.info(`Process is strated at ${new Date().toISOString()}`);

//   const { userid } = req.headers;
//   const { body } = req;
//   const { content, conversationId, photoUrl, fileUrls, receiverId } = body;

//   try {
//     // Use transaction to group related database operations
//     const result = await prisma.$transaction(async (prisma) => {
//       let conversation;
//       logger.info(`Conversation creation start at ${new Date().toISOString()}`);

//       // Create a new conversation if conversationId is not provided
//       if (!conversationId) {
//         conversation = await prisma.conversation.create({
//           data: {
//             members: {
//               create: [{ userId: userid }, { userId: receiverId }],
//             },
//           },
//         });

//         logger.info(
//           `Conversation created successfully at ${new Date().toISOString()}`
//         );
//       } else {
//         conversation = await prisma.conversation.findUnique({
//           where: { id: conversationId },
//         });

//         if (!conversation) {
//           logger.error("Conversation not found with the provided ID");
//           throw new Error("Conversation not found");
//         }

//         logger.info(
//           `Conversation found successfully at ${new Date().toISOString()}`
//         );
//       }

//       const maxLength = 30;
//       const truncatedContent =
//         content.length > maxLength
//           ? content.slice(0, maxLength) + "..."
//           : content;

//       const messageData = {
//         senderId: userid,
//         content,
//         conversationId: conversation.id,
//         photoUrl: photoUrl || [],
//         fileUrls: fileUrls || [],
//         status: "SENT",
//       };

//       // Save the message and update conversation data concurrently
//       const [message] = await Promise.all([
//         prisma.message.create({ data: messageData }),
//         prisma.conversation.update({
//           where: { id: conversation.id },
//           data: {
//             lastMessage: {
//               content: truncatedContent,
//               senderId: userid,
//               createdAt: new Date(),
//             },
//             lastActivity: new Date(),
//           },
//         }),
//       ]);
//       logger.info(`Complete message creation at ${new Date().toISOString()}`);
//       return { conversation, message };
//     });

//     const { message } = result;

//     const receiverSocketId = getReceiverSocketId(receiverId);

//     // Emit the new message if the receiver is connected
//     if (receiverSocketId) {
//       logger.info(
//         `Emitting new message to socket at ${new Date().toISOString()}`
//       );

//       io.to(receiverSocketId).emit("newMessage", message, (ack) => {
//         if (!ack) {
//           logger.error(
//             "Socket emit acknowledgment failed, recipient might be disconnected"
//           );
//         }
//       });
//       logger.info(`Emitting message finished at ${new Date().toISOString()}`);
//     } else {
//       logger.info("Receiver socket ID not found, message not emitted");
//     }

//     return {
//       success: true,
//       message,
//     };
//   } catch (error) {
//     throw new Error(error.message);
//   }
// };

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
    });
  }

  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
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

export const getMessagesByConversationIdService = async (conversationId) => {
  const messages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "desc" },
  });
  return {
    success: true,
    messages,
  };
};

export const getMessagesByChannelIdService = async (channelId) => {
  return await prisma.message.findMany({
    where: { channelId },
    orderBy: { createdAt: "asc" },
  });
};

export const getMessagesByGroupIdService = async (groupId) => {
  return await prisma.message.findMany({
    where: { groupId },
    orderBy: { createdAt: "asc" },
  });
};

// export const sendDmMessageService = async (req) => {
//   console.log(`Process is started at ${new Date().toISOString()}`);

//   const { userid } = req.headers;
//   const { body } = req;
//   const { content, conversationId, photoUrl, fileUrls, receiverId } = body;

//   try {
//     // Use transaction to group related database operations
//     const result = await prisma.$transaction(async (prisma) => {
//       let conversation;

//       // Create a new conversation if conversationId is not provided
//       if (!conversationId) {
//         console.log(
//           `Conversation creation start at ${new Date().toISOString()}`
//         );
//         conversation = await prisma.conversation.create({
//           data: {
//             members: {
//               create: [
//                 {
//                   userId: userid,
//                 },
//                 {
//                   userId: receiverId,
//                 },
//               ],
//             },
//           },
//         });
//         console.log(
//           `Conversation created successfully at ${new Date().toISOString()}`
//         );
//       } else {
//         conversation = await prisma.conversation.findUnique({
//           where: { id: conversationId },
//         });

//         if (!conversation) {
//           console.error("Conversation not found with the provided ID");
//           throw new Error("Conversation not found");
//         }

//         console.log(
//           `Conversation found successfully at ${new Date().toISOString()}`
//         );
//       }

//       const maxLength = 30;
//       const truncatedContent =
//         content.length > maxLength
//           ? content.slice(0, maxLength) + "..."
//           : content;

//       const messageData = {
//         senderId: userid,
//         content,
//         conversationId: conversation.id,
//         photoUrl: photoUrl || [],
//         fileUrls: fileUrls || [],
//         status: "SENT",
//       };

//       // Save the message and update conversation data concurrently
//       const [message] = await Promise.all([
//         prisma.message.create({ data: messageData }),
//         prisma.conversation.update({
//           where: { id: conversation.id },
//           data: {
//             lastMessage: {
//               content: truncatedContent,
//               senderId: userid,
//               createdAt: new Date(),
//             },
//             lastActivity: new Date(),
//           },
//         }),
//       ]);
//       console.log(`Complete message creation at ${new Date().toISOString()}`);
//       return { conversation, message };
//     });

//     const { message } = result;

//     const receiverSocketId = getReceiverSocketId(receiverId);

//     // Emit the new message if the receiver is connected
//     if (receiverSocketId) {
//       console.log(
//         `Emitting new message to socket at ${new Date().toISOString()}`
//       );

//       io.to(receiverSocketId).emit("newMessage", message, (ack) => {
//         if (!ack) {
//           console.error(
//             "Socket emit acknowledgment failed, recipient might be disconnected"
//           );
//         }
//       });
//       console.log(`Emitting message finished at ${new Date().toISOString()}`);
//     } else {
//       console.log("Receiver socket ID not found, message not emitted");
//     }

//     return {
//       success: true,
//       message,
//     };
//   } catch (error) {
//     throw new Error(error.message);
//   }
// };
