import { Router } from "express";
import { checkToken } from "../middlewares/checkAuth";
import {
  acceptFriendRequest,
  cancelFriendRequest,
  getFriendRequests,
  getFriendsList,
  getOutgoingFriendRequest,
  rejectFriendRequest,
  searchUsers,
  sendFriendRequest,
} from "../controllers/friend.controller";
const router = Router();

router.get("/find-friends", checkToken, searchUsers);

router.get("/get-all-friends", checkToken, getFriendsList);

router.get(
  "/get-outgoing-friend-requests",
  checkToken,
  getOutgoingFriendRequest
);

router.get("/get-friends-requests", checkToken, getFriendRequests);

router.post("/send-friend-request", checkToken, sendFriendRequest);

router.post("/accept-friend-request", checkToken, acceptFriendRequest);

router.post("/reject-friend-request", checkToken, rejectFriendRequest);

router.post("/cancel-friend-request", checkToken, cancelFriendRequest);


export default router;
