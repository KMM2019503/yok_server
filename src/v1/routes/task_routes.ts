// routes/userRoutes.ts
import { Router } from "express";
import { createTask, getTask } from "../controllers/task_controller";

const router = Router();

// Create a new user
router.post("/", createTask);

// Get a user by ID
router.get("/:id", getTask);

export default router;
