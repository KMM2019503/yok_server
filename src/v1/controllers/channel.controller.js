import {
  addAdminService,
  createChannelService,
  deleteChannelService,
  getAllChannelsService,
  getChannel,
  removeAdminService,
  updateChannelService,
} from "../services/channel.services.js";
import logger from "../utils/logger.js";

export const createChannel = async (req, res) => {
  try {
    const response = await createChannelService(req);
    res.status(201).json(response);
  } catch (error) {
    logger.error("Error occurred during user create:", {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ error: error.message });
  }
};

export const updateChannel = async (req, res) => {
  try {
    const response = await updateChannelService(req);
    res.status(200).json(response);
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
    console.log("getAllChannels controller called");
    const response = await getAllChannelsService(req);
    res.status(200).json(response);
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
    console.log("getChannelById controller called");
    const response = await getChannel(req);
    res.status(200).json(response);
  } catch (error) {
    logger.error("Error occurred during user update:", {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ error: error.message });
  }
};

// New controllers for adding and removing admins
export const addAdminToChannel = async (req, res) => {
  try {
    const response = await addAdminService(req);
    res
      .status(201)
      .json({ message: "Admin added successfully", data: response });
  } catch (error) {
    logger.error("Error occurred while adding admin to the channel:", {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ error: error.message });
  }
};

export const removeAdminFromChannel = async (req, res) => {
  try {
    const response = await removeAdminService(req);
    res
      .status(200)
      .json({ message: "Admin removed successfully", data: response });
  } catch (error) {
    logger.error("Error occurred while removing admin from the channel:", {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ error: error.message });
  }
};

export const deleteChannel = async (req, res) => {
  try {
    const response = await deleteChannelService(req);
    res
      .status(200)
      .json({ message: "Channel deleted successfully", data: response });
  } catch (error) {
    logger.error("Error occurred while deleting channel:", {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ error: error.message });
  }
};
