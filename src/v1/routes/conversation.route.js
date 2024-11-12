import { Router } from "express";
import { checkToken } from "../middlewares/checkAuth";
import {
  getAllConversations,
  getConversationMessages,
  getConversation,
} from "../controllers/conversation.controller";

const router = Router();

// Get all conversations for the authenticated user with pagination
// router.get("/", checkToken, getAllConversations);
router.get("/", getAllConversations);

// get conversation messages by conversation id
router.get("/:conversationId/messages", checkToken, getConversationMessages);

// get conversations by conversation id

router.get("/:conversationId", getConversation);

export default router;
