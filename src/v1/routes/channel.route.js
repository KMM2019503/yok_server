import { Router } from "express";

import { checkToken } from "../middlewares/checkAuth";
import { isSuperAdmin } from "../middlewares/channels/superAdminMiddleware";

import {
  addAdminToChannel,
  createChannel,
  deleteChannel,
  getAllChannels,
  getChannelMessagesByChannelId,
  removeAdminFromChannel,
  updateChannel,
} from "../controllers/channel.controller";

const router = Router();

router.use(checkToken);

// Get a channel Messages by channel ID, requires user to be authenticated and have admin rights.
router.get("/get-channel-by-id/:channelId", getChannelMessagesByChannelId);

// Get all channels, requires user to be authenticated.
router.get("/", getAllChannels);

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

//todo list
//add member -> only admin and super admins can access
//remove momber -> only admin and super admins can access

export default router;
