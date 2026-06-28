import { Router } from "express";
import { requireAuth } from "../../shared/middleware/auth";
import { validate } from "../../shared/middleware/validate";
import {
  acceptFriendRequest,
  cancelFriendRequest,
  getFriendshipStatus,
  listFriends,
  listIncomingRequests,
  listOutgoingRequests,
  rejectFriendRequest,
  sendFriendRequest,
  unfriend,
} from "./friends.controller";
import {
  friendIdSchema,
  friendRequestIdSchema,
  friendshipStatusSchema,
  listFriendRequestsSchema,
  listFriendsSchema,
  sendFriendRequestSchema,
} from "./friends.schema";

const router = Router();

// Friend requests
router.post("/requests", requireAuth, validate(sendFriendRequestSchema), sendFriendRequest);
router.get("/requests/incoming", requireAuth, validate(listFriendRequestsSchema), listIncomingRequests);
router.get("/requests/outgoing", requireAuth, validate(listFriendRequestsSchema), listOutgoingRequests);
router.post("/requests/:requestId/accept", requireAuth, validate(friendRequestIdSchema), acceptFriendRequest);
router.post("/requests/:requestId/reject", requireAuth, validate(friendRequestIdSchema), rejectFriendRequest);
router.delete("/requests/:requestId", requireAuth, validate(friendRequestIdSchema), cancelFriendRequest);

// Friends + relationship status
router.get("/status/:userId", requireAuth, validate(friendshipStatusSchema), getFriendshipStatus);
router.get("/", requireAuth, validate(listFriendsSchema), listFriends);
router.delete("/:friendId", requireAuth, validate(friendIdSchema), unfriend);

export default router;
