// routes/index.ts
import { Router, type Request, type Response } from "express";
import authRoutes from "./auth.routes"

const router = Router();


router.use("/", authRoutes)


// Add other routes here

export default router;
