import dotenv from "dotenv";
import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";
import logger from "./v1/utils/logger"; // Import the logger
import routes from "./v1/routes"; // Import your routes

dotenv.config(); // Load environment variables

const startServer = () => {
  const app = express();

  // Middleware to parse incoming JSON requests
  app.use(express.json());

  // Ensure port is a number
  const port: number = parseInt(process.env.PORT || "3000", 10);

  // Use routes
  app.use("/v1/", routes);

  // Global error handler (optional, for better error handling)
  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    logger.error(err.stack); // Use Winston for error logging
    res.status(500).json({ message: '"Something went wrong!"' });
  });

  // Start the server
  app.listen(port, () => {
    logger.info(`Server is running on port ${port}`); // Use Winston for logging
  });
};

export default startServer;
