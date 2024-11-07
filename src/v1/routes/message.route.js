// message.route.js
import { Router } from "express";
import { checkToken } from "../middlewares/checkAuth";
import {
  //   sendMessage,
  getMessagesByConversationId,
  getMessagesByChannelId,
  getMessagesByGroupId,
  sendDmMessage,
  updateMessageStatus,
} from "../controllers/message.controller";

const router = Router();

// Route to send a message
// router.post("/", checkToken, sendMessage);

// Send DM messages
// router.post("/direct-message", checkToken, sendDmMessage);
router.post("/direct-message", sendDmMessage);

// Route to mark a message as read
router.put("/messages/:id/read", checkToken, updateMessageStatus);

// Route to get messages by conversation ID
router.get(
  "/conversation/:conversationId",
  checkToken,
  getMessagesByConversationId
);

// Route to get messages by channel ID
router.get("/channel/:channelId", checkToken, getMessagesByChannelId);

// Route to get messages by group ID
router.get("/group/:groupId", checkToken, getMessagesByGroupId);

export default router;
