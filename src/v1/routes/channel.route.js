import { Router } from "express";

import { checkToken } from "../middlewares/checkAuth";
import { isSuperAdmin } from "../middlewares/channels/superAdminMiddleware";

import {
  addAdminToChannel,
  addMemberToChannel,
  createChannel,
  deleteChannel,
  getAllChannels,
  getChannel,
  getChannelMessagesByChannelId,
  getComments,
  getLatestMessagesInChannel,
  joinMemberToChannel,
  leaveMemberFromChannel,
  removeAdminFromChannel,
  removeMemberFromChannel,
  updateChannel,
} from "../controllers/channel.controller";

const router = Router();

// router.use(checkToken);

router.get("/initial-channels/fetch-message", getLatestMessagesInChannel);

router.get("/:channelId", getChannel);

// Get a channel Messages by channel ID, requires user to be authenticated and have admin rights.
router.get("/:channelId/messages", getChannelMessagesByChannelId);

// Get all channels, requires user to be authenticated.
router.get("/", getAllChannels);

router.get("/get/comments", getComments);

// Create a new channel, requires user to be authenticated
router.post("/", createChannel);

// Update an existing channel, requires user to be authenticated and have admin rights.
router.put("/update/:channelId", isSuperAdmin, updateChannel);

// Add an admin to a channel, requires user to be authenticated and have Super admin rights.
router.post("/:channelId/add-admin", isSuperAdmin, addAdminToChannel);

// Remove an admin from a channel, requires user to be authenticated and have Super admin rights.
router.post("/:channelId/remove-admin", isSuperAdmin, removeAdminFromChannel);

// Delete a channel, requires user to be authenticated and have Super admin rights.
router.delete("/:channelId", isSuperAdmin, deleteChannel);

//add member -> only admin and super admins can access
router.post("/add-members", addMemberToChannel);

//remove member -> only admin and super admins can access
router.post("/remove-members", removeMemberFromChannel);

//join member
router.post("/join-member", joinMemberToChannel);

//leave member
router.post("/leave-member", leaveMemberFromChannel);

export default router;
