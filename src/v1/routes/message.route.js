// message.route.js
import { Router } from "express";
import { checkToken } from "../middlewares/checkAuth";
import {
  sendChannelMessage,
  //   sendMessage,
  sendDmMessage,
  sendGroupMessage,
} from "../controllers/message.controller";
import { checkIsAdmin } from "../middlewares/channels/checkAdminMiddleware";

const router = Router();

// Route to send a message
// router.post("/", checkToken, sendMessage);

// Send DM messages
router.post("/direct-message", checkToken, sendDmMessage);
// router.post("/direct-message", sendDmMessage);

//Send Group messages
router.post("/group-messages", checkToken, sendGroupMessage);
// router.post("/group-messages", sendGroupMessage);

//Send Group messages
router.post("/channel-messages", checkIsAdmin, sendChannelMessage);
// router.post("/group-messages", sendGroupMessage);

// router.post("/direct-message", sendDmMessage);

export default router;
