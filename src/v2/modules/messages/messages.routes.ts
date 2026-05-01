import { Router } from "express";
import { requireAuth } from "../../shared/middleware/auth";
import { requireChannelAdmin } from "../../shared/middleware/channel-access";
import { validate } from "../../shared/middleware/validate";
import {
  sendChannelInvitationMessage,
  sendChannelMessage,
  sendChannelMessageComment,
  sendDmMessage,
  sendGroupMessage,
} from "./messages.controller";
import {
  sendChannelCommentSchema,
  sendChannelInvitationSchema,
  sendChannelMessageSchema,
  sendDirectMessageSchema,
  sendGroupMessageSchema,
} from "./messages.schema";

const router = Router();

router.post(
  "/direct-message",
  requireAuth,
  validate(sendDirectMessageSchema),
  sendDmMessage,
);
router.post(
  "/send-invitation",
  requireAuth,
  validate(sendChannelInvitationSchema),
  sendChannelInvitationMessage,
);
router.post(
  "/group-messages",
  requireAuth,
  validate(sendGroupMessageSchema),
  sendGroupMessage,
);
router.post(
  "/channel-messages",
  requireAuth,
  validate(sendChannelMessageSchema),
  requireChannelAdmin,
  sendChannelMessage,
);
router.post(
  "/channel-messages-comment",
  requireAuth,
  validate(sendChannelCommentSchema),
  sendChannelMessageComment,
);

export default router;
