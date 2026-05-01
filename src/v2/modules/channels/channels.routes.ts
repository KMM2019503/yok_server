import { Router } from "express";
import { requireAuth } from "../../shared/middleware/auth";
import { requireSuperAdmin } from "../../shared/middleware/channel-access";
import { validate } from "../../shared/middleware/validate";
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
  joinChannelByInvitation,
  joinMemberToChannel,
  leaveMemberFromChannel,
  removeAdminFromChannel,
  removeMemberFromChannel,
  updateChannel,
} from "./channels.controller";
import {
  adminListSchema,
  channelIdParamSchema,
  channelMessagesSchema,
  commentsSchema,
  createChannelSchema,
  initialChannelsSchema,
  memberMutationSchema,
  updateChannelSchema,
} from "./channels.schema";

const router = Router();

router.get(
  "/initial-channels/fetch-message",
  requireAuth,
  validate(initialChannelsSchema),
  getLatestMessagesInChannel,
);

router.get("/get/comments", requireAuth, validate(commentsSchema), getComments);
router.get("/:channelId", requireAuth, validate(channelIdParamSchema), getChannel);
router.get(
  "/:channelId/messages",
  requireAuth,
  validate(channelMessagesSchema),
  getChannelMessagesByChannelId,
);

router.get("/", requireAuth, getAllChannels);

router.post("/", requireAuth, validate(createChannelSchema), createChannel);

router.put(
  "/update/:channelId",
  requireAuth,
  validate(updateChannelSchema),
  requireSuperAdmin,
  updateChannel,
);

router.post(
  "/:channelId/add-admin",
  requireAuth,
  validate(adminListSchema),
  requireSuperAdmin,
  addAdminToChannel,
);

router.post(
  "/:channelId/remove-admin",
  requireAuth,
  validate(adminListSchema),
  requireSuperAdmin,
  removeAdminFromChannel,
);

router.delete(
  "/:channelId",
  requireAuth,
  validate(channelIdParamSchema),
  requireSuperAdmin,
  deleteChannel,
);

router.post(
  "/add-members",
  requireAuth,
  validate(memberMutationSchema),
  addMemberToChannel,
);

router.post(
  "/remove-members",
  requireAuth,
  validate(memberMutationSchema),
  removeMemberFromChannel,
);

router.post(
  "/join-member",
  requireAuth,
  validate(memberMutationSchema),
  joinMemberToChannel,
);

router.post(
  "/leave-member",
  requireAuth,
  validate(memberMutationSchema),
  leaveMemberFromChannel,
);

router.post(
  "/join-channel-by-invite",
  requireAuth,
  validate(memberMutationSchema),
  joinChannelByInvitation,
);

export default router;
