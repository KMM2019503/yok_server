import { Router } from "express";
import { checkToken } from "../middlewares/checkAuth";
import {
  getAllConversations,
  getConversation,
  getConversationMessages,
} from "../controllers/conversation.controller";

const router = Router();

router.use(checkToken);

// Get all conversations for the authenticated user with pagination
router.get("/", getAllConversations);

// get conversation messages by conversation id
router.get("/:conversationId/messages", getConversationMessages);

// get conversations by conversation id

router.get("/:conversationId", getConversation);

export default router;
