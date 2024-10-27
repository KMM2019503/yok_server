import logger from "../utils/logger.js";

export const createGroup = async (req, res) => {
  try {
    const response = await creteGroupService(req);
    res.status(201).json(response);
  } catch (error) {
    logger.error("Error occurred during create group:", {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ error: error.message, success: false });
  }
};
