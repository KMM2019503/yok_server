import { Router } from "express";
import { checkToken } from "../middlewares/checkAuth";
import {
  getAllConversations,
  getAllFileUrls,
  getConversation,
  getConversationMessages,
  getLatestMessagesInConversations,
} from "../controllers/conversation.controller";

const router = Router();

// router.use(checkToken);

// Get all conversations for the authenticated user with pagination
router.get("/get-conversation", checkToken, getAllConversations);
router.get("/get-messages/:conversationId",checkToken , getConversationMessages);

//New Route for initail fetch
router.get(
  "/initial-conversation/fetch-message",
  getLatestMessagesInConversations
);

// get conversation messages by conversation id

// get conversations by conversation id

// router.get("/:conversationId", getConversation);

// router.get("/file-urls/getAllFileUrls", getAllFileUrls);

export default router;
