import admin from "../utils/firebase"; // Import your Firebase admin instance
import logger from "../utils/logger";

export const checkToken = async (req, res, next) => {
  const AuthToken = req.cookies.AuthToken; // Assuming the token is stored in cookies
  if (!AuthToken) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized - You do not have permission to access this route",
    });
  }

  try {
    // Verify the Firebase ID token
    const decoded = await admin.auth().verifyIdToken(AuthToken);
    req.userId = decoded.uid; // Attach user ID to the request object
    next(); // Proceed to the next middleware or route handler
  } catch (error) {
    if (error.code === "auth/id-token-expired") {
      return res.status(401).json({
        success: false,
        message: "Token expired. Please log in again.",
      });
    }
    logger.error("Error in checkToken:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
