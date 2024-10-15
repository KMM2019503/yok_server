import cors from "cors";
import logger from "../utils/logger";
import { type Request, type Response, type NextFunction } from "express";

// List of allowed origins (use actual IPs or domain names)
const whitelist = [
  "http://localhost:3000", // Example for localhost
  "http://your-laptop-ip:3000", // Replace with your actual IP
  "http://coworker-laptop-ip:3000", // Replace with your coworker's IP
  null, //  // For Postman requests (Postman sends a null origin)
];

const corsOptions = {
  origin: function (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void
  ) {
    if (whitelist.includes(origin || null)) {
      callback(null, true); // Allow the request
    } else {
      // Log the error and send a 403 Forbidden response
      logger.error(`The origin ${origin} is not allowed by the server`);
      callback(new Error(`The origin ${origin} is not allowed by the server`)); // Block the request
    }
  },
};

// Create a CORS middleware function to handle forbidden requests
const corsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  cors(corsOptions)(req, res, (err) => {
    if (err) {
      return res.status(403).json({ message: err.message });
    }
    next();
  });
};

// Export the CORS middleware
export default corsMiddleware;
