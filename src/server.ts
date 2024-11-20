import dotenv from "dotenv";
import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";
import logger from "./v1/utils/logger"; // Import the logger
import routes from "./v1/routes"; // Import your routes
import applyMiddlewares from "./v1/middlewares";
import cookieParser from "cookie-parser";
import { app, server } from "../socket/Socket.js";

dotenv.config(); // Load environment variables

// Validate environment variables
const port = parseInt(process.env.PORT || "3000", 10);
if (isNaN(port)) {
  logger.error("Invalid PORT environment variable");
  process.exit(1); // Exit if port is invalid
}

const startServer = () => {
  app.use(express.json());
  app.use(cookieParser());

  // Apply middlewares
  applyMiddlewares(app);

  // Use routes
  app.use("/v1/", routes);

  app.get("/healthz", (req: Request, res: Response) => {
    res.status(200).json({
      status: "ok",
      message: "Server is healthy",
      timestamp: new Date().toISOString(),
    });
  });

  // Global error handler
  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    logger.error(err.stack || err.message); // Use Winston for error logging
    res.status(500).json({ message: "Something went wrong!" });
  });

  // Start the server
  server.listen(port, () => {
    logger.info(`Server is running on port ${port}`);
  });

  // Handle graceful shutdown
  process.on("SIGINT", () => {
    logger.info("Received SIGINT. Shutting down gracefully...");
    server.close(() => {
      logger.info("Server shut down.");
      process.exit(0);
    });
  });
};

export default startServer;
