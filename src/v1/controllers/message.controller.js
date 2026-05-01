import {
  sendChannelInvitationService,
  sendChannelMessageCommentService,
  sendChannelMessageService,
  sendDmMessageService,
  sendDMMessageServiceV2,
  sendGroupMessageService,
} from "../services/message.services";

import logger from "../utils/logger";

export const sendDmMessage = async (req, res) => {
  try {
    const response = await sendDMMessageServiceV2(req);
    res.status(201).json(response);
  } catch (error) {
    logger.error("Error occurred during Send DM Message:", {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ error: error.message });
  }
};

export const sendChannelInvitationMessage = async (req, res) => {
  try {
    const response = await sendChannelInvitationService(req);
    res.status(201).json(response);
  } catch (error) {
    logger.error("Error occurred during Send Channel Invitation:", {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ error: error.message });
  }
};

export const sendGroupMessage = async (req, res) => {
  try {
    const response = await sendGroupMessageService(req);
    res.status(201).json(response);
  } catch (error) {
    logger.error("Error occurred during Send Group Message:", {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ error: error.message });
  }
};

export const sendChannelMessage = async (req, res) => {
  try {
    const response = await sendChannelMessageService(req);
    res.status(201).json(response);
  } catch (error) {
    logger.error("Error occurred during Send channel Message:", {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ error: error.message });
  }
};

export const sendChannelMessageComment = async (req, res) => {
  try {
    const response = await sendChannelMessageCommentService(req);
    res.status(201).json(response);
  } catch (error) {
    logger.error("Error occurred during Send channel Message Comment:", {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ error: error.message });
  }
};
