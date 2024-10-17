import { Router } from "express";
import { checkToken } from "../middlewares/checkAuth";
import {
  createChannel,
  getAllChannels,
  getChannelById,
} from "../controllers/channel.controller";
const router = Router();

router.get("/:channelId", checkToken, getChannelById);
router.get("/getAllchannels", checkToken, getAllChannels);
router.post("/", checkToken, createChannel);

export default router;
