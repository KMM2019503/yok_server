import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";
import dotenv from "dotenv";

dotenv.config(); // Load environment variables

const app = express();

// Middleware to parse incoming JSON requests
app.use(express.json());

// Ensure port is a number
const port: number = parseInt(process.env.PORT || "3000", 10);

// Basic route
app.get("/", (req: Request, res: Response) => {
  res.send("Hello, world!");
});

// Global error handler (optional, for better error handling)
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).send("Something went wrong!");
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
