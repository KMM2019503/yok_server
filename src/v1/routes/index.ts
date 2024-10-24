// routes/index.ts
import { Router, type Request, type Response } from "express";
import authRoutes from "./auth.routes"
import userRoutes from "./users.routes"
import channelRoutes from "./channel.route"
import MessageRoutes from "./message.route"
import ConversationRoutes from "./conversation.route"

const router = Router();


router.use("/", authRoutes)
router.use("/users", userRoutes)
router.use("/channels", channelRoutes)
router.use("/messages", MessageRoutes)
router.use("/conversation", ConversationRoutes)


// Add other routes here

export default router;
