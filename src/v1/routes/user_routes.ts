// routes/userRoutes.ts
import { Router } from "express";
import { createUser, getUser } from "../controllers/user_controller";

const router = Router();

// Create a new user
router.post("/", createUser);

// Get a user by ID
router.get("/:id", getUser);

export default router;
