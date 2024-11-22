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

router.use(checkToken);

// Send DM messages
router.post("/direct-message", sendDmMessage);

//Send Group messages
router.post("/group-messages", sendGroupMessage);

//Send Group messages
router.post("/channel-messages", checkIsAdmin, sendChannelMessage);

export default router;
