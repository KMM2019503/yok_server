import { Router } from "express";

import { checkToken } from "../middlewares/checkAuth";
import { isSuperAdmin } from "../middlewares/channels/superAdminMiddleware";

import {
  addAdminToChannel,
  createChannel,
  deleteChannel,
  getAllChannels,
  getChannelById,
  removeAdminFromChannel,
  updateChannel,
} from "../controllers/channel.controller";

const router = Router();

router.get("/get-channel-by-id/:channelId", checkToken, getChannelById);
router.get("/", checkToken, getAllChannels);
router.post("/", checkToken, createChannel);
router.put("/update/:channelId", checkToken, isSuperAdmin, updateChannel);

router.post(
  "/:channelId/add-admin",
  checkToken,
  isSuperAdmin,
  addAdminToChannel
);
router.post(
  "/:channelId/remove-admin",
  checkToken,
  isSuperAdmin,
  removeAdminFromChannel
);

router.delete("/:channelId", checkToken, isSuperAdmin, deleteChannel);

export default router;
