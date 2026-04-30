import type { Router} from "express";
import { type Request, type Response } from "express";
import authRoutes from "../modules/auth/auth.routes";
import userRoutes from "../modules/users/users.routes";
import channelRoutes from "../modules/channels/channels.routes";
import messageRoutes from "../modules/messages/messages.routes";
import conversationRoutes from "../modules/conversations/conversations.routes";

export const registerRoutes = (router: Router) => {
  router.get("/healthy", (_req: Request, res: Response) => {
    res.status(200).json({
      status: "ok",
      message: "V2 server is healthy",
      timestamp: new Date().toISOString(),
    });
  });

  router.use("/", authRoutes);
  router.use("/users", userRoutes);
  router.use("/channels", channelRoutes);
  router.use("/messages", messageRoutes);
  router.use("/conversations", conversationRoutes);
};
