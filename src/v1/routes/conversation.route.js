import { Router } from "express";
import { checkToken } from "../middlewares/checkAuth";
import {
  getAllConversations,
  getConversation,
  syncConversaions,
} from "../controllers/conversation.controller";

const router = Router();

// Get all conversations for the authenticated user with pagination
router.get("/", checkToken, getAllConversations);

// sync conversations with the frontend
router.post("/sync", checkToken, syncConversaions);

// get conversation by conversation id
router.get("/:conversationId", checkToken, getConversation);
// router.get("/:conversationId", getConversation);

export default router;
