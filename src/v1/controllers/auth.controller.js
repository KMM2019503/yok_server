import * as authServices from "../services/auth.services.js";
import logger from "../utils/logger.js";

export const login = async (req, res) => {
  try {
    const response = await authServices.login(req, res);
    res.status(201).json(response);
  } catch (error) {
    logger.error("Error occurred during login:", error);
    res.status(500).json({ error: error.message });
  }
};

export const signUp = async (req, res) => {
  try {
    const response = await authServices.signUp(req.body, res);
    res.status(201).json(response);
  } catch (error) {
    logger.error("Error occurred during sign-up:", error);
    res.status(500).json({ error: error.message });
  }
};

export const logout = async (req, res) => {
  try {
    res.clearCookie("AuthToken");
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    logger.error("Error occurred during logout:", error);
    res.status(500).json({ error: error.message });
  }
};
