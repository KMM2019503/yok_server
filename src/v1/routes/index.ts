// routes/index.ts
import { Router, type Request, type Response } from "express";
import userRoutes from "./user_routes";
import taskRoutes from "./task_routes";

const router = Router();

router.use("/users", userRoutes);
router.use("/tasks", taskRoutes);
// Add other routes here

export default router;
