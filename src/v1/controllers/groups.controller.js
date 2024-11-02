import {
  createGroupService,
  joinGroupService,
} from "../services/group.services.js";
import logger from "../utils/logger.js";

export const createGroup = async (req, res) => {
  try {
    const response = await createGroupService(req);
    res.status(201).json(response);
  } catch (error) {
    logger.error("Error occurred during create group:", {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ error: error.message, success: false });
  }
};

export const joinGroup = async (req, res) => {
  try {
    const response = await joinGroupService(req);
    res.status(201).json(response);
  } catch (error) {
    logger.error("Error occurred during join group:", {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ error: error.message, success: false });
  }
};
