import {
  addAdminService,
  addMemberToChannelService,
  createChannelService,
  deleteChannelService,
  getAllChannelsService,
  getChannelMessagesServices,
  getChannelService,
  getCommentsService,
  getLatestMessagesInChannelsService,
  joinMemberToChannelService,
  leaveMemberFromChannelService,
  removeAdminService,
  removeMemberFromChannelService,
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

export const getChannelMessagesByChannelId = async (req, res) => {
  try {
    const response = await getChannelMessagesServices(req);
    res.status(200).json(response);
  } catch (error) {
    logger.error("Error occurred during get Messages by channel id:", {
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

export const addMemberToChannel = async (req, res) => {
  try {
    const response = await addMemberToChannelService(req);
    res
      .status(201)
      .json({ message: "add member successfully", data: response });
  } catch (error) {
    logger.error("Error occurred while adding members to the channel:", {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ error: error.message });
  }
};

export const removeMemberFromChannel = async (req, res) => {
  try {
    const response = await removeMemberFromChannelService(req);
    res
      .status(201)
      .json({ message: "remove member successfully", data: response });
  } catch (error) {
    logger.error("Error occurred while removing members from the channel:", {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ error: error.message });
  }
};

export const joinMemberToChannel = async (req, res) => {
  try {
    const response = await joinMemberToChannelService(req);
    res
      .status(201)
      .json({ message: "join member successfully", data: response });
  } catch (error) {
    logger.error("Error occurred while joining members to the channel:", {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ error: error.message });
  }
};

export const leaveMemberFromChannel = async (req, res) => {
  try {
    const response = await leaveMemberFromChannelService(req);
    res
      .status(201)
      .json({ message: "leave member successfully", data: response });
  } catch (error) {
    logger.error("Error occurred while leaving members from the channel:", {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ error: error.message });
  }
};

export const getChannel = async (req, res) => {
  try {
    const response = await getChannelService(req);
    res.status(201).json(response);
  } catch (error) {
    logger.error("Error occurred in get chnnel:", {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ error: error.message });
  }
};

export const getLatestMessagesInChannel = async (req, res) => {
  try {
    const response = await getLatestMessagesInChannelsService(req);
    res.status(200).json(response);
  } catch (error) {
    logger.error("Error occurred during fetch latest message In channels:", {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ error: error.message });
  }
};

export const getComments = async (req, res) => {
  try {
    const response = await getCommentsService(req);
    res.status(200).json(response);
  } catch (error) {
    logger.error("Error occurred during fetch comments:", {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ error: error.message });
  }
};
