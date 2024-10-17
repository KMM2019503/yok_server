import jwt from "jsonwebtoken";
import logger from "../utils/logger";

export const checkToken = (req, res, next) => {
  const AuthToken = req.cookies.AuthToken;
  if (!AuthToken) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized - You have no token",
    });
  }

  try {
    const decoded = jwt.verify(AuthToken, process.env.JWT_SECRET_KEY);

    req.userId = decoded.userId;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired. Please log in again.",
      });
    }
    logger.error("Error in checkToken:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
