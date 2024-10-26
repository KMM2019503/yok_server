import {
  getAllConversationsService,
  getConversationService,
} from "../services/conversation.services.js";
import logger from "../utils/logger.js";

export const getAllConversations = async (req, res) => {
  try {
    const response = await getAllConversationsService(req);
    res.status(200).json(response);
  } catch (error) {
    logger.error("Error occurred during fetch all conversation:", {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ error: error.message });
  }
};

export const getConversation = async (req, res) => {
  try {
    const response = await getConversationService(req);
    res.status(200).json(response);
  } catch (error) {
    logger.error("Error occurred during fetch conversation:", {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ error: error.message });
  }
};
