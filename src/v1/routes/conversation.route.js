import { Router } from "express";
import { checkToken } from "../middlewares/checkAuth";
import {
  getAllConversations,
  getConversationMessages,
} from "../controllers/conversation.controller";

const router = Router();

// Get all conversations for the authenticated user with pagination
// router.get("/", checkToken, getAllConversations);
router.get("/", getAllConversations);

// get conversation messages by conversation id
router.get("/:conversationId/messages", getConversationMessages);

export default router;
