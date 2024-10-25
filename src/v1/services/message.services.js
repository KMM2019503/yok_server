// message.services.js
import { PrismaClient } from "@prisma/client";
import logger from "../utils/logger";
import { getReceiverSocketId, io } from "../../../socket/Socket";

const prisma = new PrismaClient();

export const sendDmMessageService = async (req) => {
  const { userid } = req.header;
  const { body } = req;
  const { content, conversationId, photoUrl, fileUrls, receiverId } = body;

  try {
    let conversation;

    // If no conversationId is provided, create a new conversation
    if (!conversationId) {
      // Create a new conversation
      conversation = await prisma.conversation.create({
        data: {
          members: {
            create: [
              {
                userId: userid,
              },
              {
                userId: receiverId,
              },
            ],
          },
        },
      });
    } else {
      // Fetch the existing conversation
      conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
      });

      if (!conversation) {
        throw new Error("Conversation not found");
      }
    }

    const maxLength = 30;
    const truncatedContent =
      content.length > maxLength
        ? content.slice(0, maxLength) + "..."
        : content;

    const messageData = {
      senderId: userid,
      content,
      conversationId: conversation.id,
      photoUrl: photoUrl || [],
      fileUrls: fileUrls || [],
      status: "SENT",
    };

    // Save the message to the database
    const message = await prisma.message.create({ data: messageData });

    // Get the receiver's socket ID for direct messaging
    const receiverSocketId = getReceiverSocketId(receiverId);

    // Emit the new message to the relevant recipient socket
    if (receiverSocketId) {
      console.log(
        "🚀 ~ sendDmMessageService ~ receiverSocketId:",
        receiverSocketId
      );
      io.to(receiverSocketId).emit("newMessage", message);

      // Update status to DELIVERED when the receiver gets the message
      await prisma.message.update({
        where: { id: message.id },
        data: { status: "DELIVERED" },
      });
    }

    // Update conversation's last message and last activity
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        lastMessage: {
          content: truncatedContent,
          senderId: userId,
          createdAt: new Date(),
        },
        lastActivity: new Date(),
      },
    });

    return {
      success: true,
      message,
    };
  } catch (error) {
    logger.error("Error sending direct message:", error);
    throw new Error("Failed to send direct message");
  }
};

export const getMessagesByConversationIdService = async (conversationId) => {
  return await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
  });
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

// export const sendMessageService = async (req) => {
//     const { userId, body } = req;
//     const { content, conversationId, channelId, groupId, photoUrl, fileUrls } =
//       body;

//     try {
//       // Create message data object with the provided details
//       const messageData = {
//         senderId: userId,
//         content,
//         conversationId: conversationId, // Default to null if not provided
//         channelId: channelId || null, // Default to null if not provided
//         groupId: groupId || null, // Default to null if not provided
//         photoUrl: photoUrl || [], // Ensure it's an array, default to empty
//         fileUrls: fileUrls || [], // Ensure it's an array, default to empty
//       };

//       // Save the message to the database using Prisma
//       const message = await prisma.message.create({ data: messageData });

//       // Get the receiver's socket ID if it's a direct message (you might need to adapt this logic based on your app)
//       const receiverSocketId = getReceiverSocketId(conversationId || groupId); // Assuming conversationId or groupId identifies the recipient

//       // Emit the new message to the relevant recipient socket
//       if (getReceiverSocketId) {
//         io.to(receiverSocketId).emit("newMessage", message);
//       }

//       // Emit to all clients to update the chat interface if needed
//       io.emit("messageReceived", message);

//       return message; // Return the created message
//     } catch (error) {
//       logger.error("Error sending message:", error); // Log the error for debugging
//       throw new Error("Failed to send message"); // Throw a user-friendly error
//     }
//   };
