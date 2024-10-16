// routes/index.ts
import { Router, type Request, type Response } from "express";
import userRoutes from "./user_routes";
import authRoutes from "./auth.routes"

const router = Router();


router.use("/", authRoutes)
router.use("/users", userRoutes);

// Add other routes here

export default router;
