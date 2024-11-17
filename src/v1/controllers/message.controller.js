import { response } from "express";
import {
  sendDmMessageService,
  sendGroupMessageService,
} from "../services/message.services";

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
