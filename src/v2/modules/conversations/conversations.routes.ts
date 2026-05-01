import { Router } from "express";
import { requireAuth } from "../../shared/middleware/auth";
import { validate } from "../../shared/middleware/validate";
import {
  getAllConversations,
  getConversationMessages,
  getLatestMessagesInConversations,
} from "./conversations.controller";
import {
  getConversationMessagesSchema,
  getConversationsSchema,
  getLatestMessagesSchema,
} from "./conversations.schema";

const router = Router();

router.get("/get-conversation", requireAuth, validate(getConversationsSchema), getAllConversations);
router.get(
  "/get-messages/:conversationId",
  requireAuth,
  validate(getConversationMessagesSchema),
  getConversationMessages,
);
router.get(
  "/initial-conversation/fetch-message",
  requireAuth,
  validate(getLatestMessagesSchema),
  getLatestMessagesInConversations,
);

export default router;
