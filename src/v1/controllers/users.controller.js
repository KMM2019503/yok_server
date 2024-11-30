import {
  addFcmTokenService,
  deleteUserService,
  fetchUserByPhoneNumberService,
  removeFcmTokenService,
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
    res.status(500).json({
      error: {
        message: error.message,
        statusCode: error.statusCode,
        errorCode: error.errorCode,
      },
      success: false,
    });
  }
};

export const addFcmToken = async (req, res) => {
  try {
    const response = await addFcmTokenService(req);
    res.status(201).json(response);
  } catch (error) {
    logger.error("Error occurred adding Fcm Token:", {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      ErrorMessage: error.message,
      success: false,
    });
  }
};

export const removeFcmToken = async (req, res) => {
  try {
    const response = await removeFcmTokenService(req);
    res.status(201).json(response);
  } catch (error) {
    logger.error("Error occurred removing Fcm Token:", {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({
      ErrorMessage: error.message,
      success: false,
    });
  }
};
