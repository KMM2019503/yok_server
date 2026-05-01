// message.route.js
import { Router } from "express";
import { checkToken } from "../middlewares/checkAuth";
import {
  sendChannelInvitationMessage,
  sendChannelMessage,
  sendChannelMessageComment,
  //   sendMessage,
  sendDmMessage,
  sendGroupMessage,
} from "../controllers/message.controller";
import { checkIsAdmin } from "../middlewares/channels/checkAdminMiddleware";

const router = Router();

// router.use(checkToken);

// Send DM messages
router.post("/direct-message", checkToken, sendDmMessage);

router.post("/send-invitation", sendChannelInvitationMessage);

//Send Group messages
router.post("/group-messages", sendGroupMessage);

//Send Channel messages
router.post("/channel-messages", checkIsAdmin, sendChannelMessage);

//Send Channel message comment
router.post("/channel-messages-comment", sendChannelMessageComment);

export default router;
