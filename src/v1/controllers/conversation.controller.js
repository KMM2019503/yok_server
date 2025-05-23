import {
  getAllConversationsService,
  getAllFileUrlsService,
  getConversationMessagesService,
  getConversationService,
  getLatestMessagesInConversationsService,
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

export const getConversationMessages = async (req, res) => {
  try {
    const response = await getConversationMessagesService(req);
    res.status(200).json(response);
  } catch (error) {
    logger.error("Error occurred during fetch conversation:", {
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
    logger.error("Error occurred during fetch all conversation:", {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ error: error.message });
  }
};

export const getLatestMessagesInConversations = async (req, res) => {
  try {
    const response = await getLatestMessagesInConversationsService(req);
    res.status(200).json(response);
  } catch (error) {
    logger.error(
      "Error occurred during fetch latest message In conversation:",
      {
        message: error.message,
        stack: error.stack,
      }
    );
    res.status(500).json({ error: error.message });
  }
};

export const getAllFileUrls = async (req, res) => {
  try {
    const response = await getAllFileUrlsService(req);
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
