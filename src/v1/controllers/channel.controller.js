import {
  createChannelService,
  getAllChannelsService,
  getChannel,
} from "../services/channel.services.js";
import logger from "../utils/logger.js";

export const createChannel = async (req, res) => {
  try {
    const response = await createChannelService(req);
    res.status(201).json(response);
  } catch (error) {
    logger.error("Error occurred during user update:", {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ error: error.message });
  }
};

export const getAllChannels = async (req, res) => {
  try {
    const response = await getAllChannelsService(req);
    res.status(201).json(response);
  } catch (error) {
    logger.error("Error occurred during user update:", {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ error: error.message });
  }
};

export const getChannelById = async (req, res) => {
  try {
    const response = await getChannel(req);
    res.status(201).json(response);
  } catch (error) {
    logger.error("Error occurred during user update:", {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ error: error.message });
  }
};
