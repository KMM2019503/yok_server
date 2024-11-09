import { Router } from "express";
import { checkToken } from "../middlewares/checkAuth";
import {
  getAllConversations,
  getConversation,
} from "../controllers/conversation.controller";

const router = Router();

// Get all conversations for the authenticated user with pagination
router.get("/", checkToken, getAllConversations);
// router.get("/", getAllConversations);

// get conversation by conversation id
router.get("/:conversationId", checkToken, getConversation);
// router.get("/:conversationId", getConversation);

export default router;
