import {
  deleteUserService,
  fetchUserByPhoneNumberService,
  updateUserService,
} from "../services/users.services.js";
import logger from "../utils/logger.js";

export const updateUser = async (req, res) => {
  try {
    const response = await updateUserService(req);
    res.status(200).json(response);
  } catch (error) {
    logger.error("Error occurred during user update:", {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ error: error.message, success: false });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const response = await deleteUserService(req);
    res.status(200).json(response);
  } catch (error) {
    logger.error("Error occurred during user update:", {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ error: error.message, success: false });
  }
};

export const getUserByPhoneNumber = async (req, res) => {
  try {
    const response = await fetchUserByPhoneNumberService(req);
    res.status(200).json(response);
  } catch (error) {
    logger.error("Error occurred fetching user by PhoneNumber:", {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ error: error.message, success: false });
  }
};
