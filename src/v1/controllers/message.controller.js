import { sendDmMessageService } from "../services/message.services";
import { getMessagesByChannelIdService } from "../services/message.services";
import { getMessagesByGroupIdService } from "../services/message.services";
import { getMessagesByConversationIdService } from "../services/message.services";
// import { sendMessageService } from "../services/message.services";
import logger from "../utils/logger";

// export const sendMessage = async (req, res) => {
//   try {
//     const response = await sendMessageService(req);
//     res.status(201).json(response);
//   } catch (error) {
//     logger.error("Error occurred during sendMessage:", {
//       message: error.message,
//       stack: error.stack,
//     });
//     res.status(500).json({ error: error.message });
//   }
// };

export const sendDmMessage = async (req, res) => {
  try {
    const response = await sendDmMessageService(req);
    res.status(201).json(response);
  } catch (error) {
    logger.error("Error occurred during Send DM Message:", {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ error: error.message });
  }
};

export const updateMessageStatus = async (req, res) => {
  const messageId = req.params.id;

  try {
    // Update the message status to 'READ'
    const updatedMessage = await prisma.message.update({
      where: { id: messageId },
      data: { status: "READ" },
    });

    // Optionally, emit an event if using WebSockets
    const receiverSocketId = getReceiverSocketId(updatedMessage.senderId); // Adjust as needed
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("messageRead", updatedMessage);
    }

    res.status(200).json(updatedMessage);
  } catch (error) {
    logger.error("Error updating message status:", error);
    res.status(500).json({ message: "Failed to update message status" });
  }
};

export const getMessagesByConversationId = async (req, res) => {
  try {
    const response = await getMessagesByConversationIdService(
      req.params.conversationId
    );
    res.status(200).json(response);
  } catch (error) {
    logger.error("Error occurred during getMessagesByConversationId:", {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ error: error.message });
  }
};

export const getMessagesByChannelId = async (req, res) => {
  try {
    const response = await getMessagesByChannelIdService(req.params.channelId);
    res.status(200).json(response);
  } catch (error) {
    logger.error("Error occurred during getMessagesByChannelId:", {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ error: error.message });
  }
};

export const getMessagesByGroupId = async (req, res) => {
  try {
    const response = await getMessagesByGroupIdService(req.params.groupId);
    res.status(200).json(response);
  } catch (error) {
    logger.error("Error occurred during getMessagesByGroupId:", {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ error: error.message });
  }
};
