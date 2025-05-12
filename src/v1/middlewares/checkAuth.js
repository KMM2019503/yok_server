import jwt from "jsonwebtoken";
import logger from "../utils/logger";


export const checkToken = async (req, res, next) => {
  try {
    // Get token from cookie
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized: No token provided" });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    console.log("🚀 ~ checkToken ~ decoded:", decoded)
    
    req.userid = decoded.id;
    next();
  } catch (error) {
    logger.error("Error in checkToken:", error);
    return res.status(401).json({ success: false, message: "Invalid or expired token" });
  }
};
