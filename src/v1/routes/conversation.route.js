import { Router } from "express";
import { checkToken } from "../middlewares/checkAuth";
import {
  getAllConversations,
  getConversation,
  getConversationMessages,
} from "../controllers/conversation.controller";

const router = Router();

// Get all conversations for the authenticated user with pagination
router.get("/", checkToken, getAllConversations);

// get conversation messages by conversation id
router.get("/:conversationId/messages", checkToken, getConversationMessages);

// get conversations by conversation id

router.get("/:conversationId", checkToken, getConversation);

export default router;
