import admin from "../utils/firebase"; // Import your Firebase admin instance
import logger from "../utils/logger";

export const checkToken = async (req, res, next) => {
  const authHeader = req.headers.authorization; // Extract the Authorization header

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized - You do not have permission to access this route",
    });
  }

  const authToken = authHeader.split(" ")[1];

  try {
    // Verify the Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(authToken);
    req.firebaseUserId = decodedToken.uid; // Attach user ID to the request object
    next(); // Proceed to the next middleware or route handler
  } catch (error) {
    if (error.code === "auth/id-token-expired") {
      return res.status(401).json({
        success: false,
        message: "Token expired. Please log in again.",
      });
    } else if (error.code === "auth/argument-error") {
      return res.status(400).json({
        success: false,
        message: "Invalid token. Please log in again.",
      });
    }

    logger.error("Error in checkToken:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
