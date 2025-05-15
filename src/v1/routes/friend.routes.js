import { Router } from "express";
import { checkToken } from "../middlewares/checkAuth";
import { acceptFriendRequest, getFriendsList, searchUsers, sendFriendRequest } from "../controllers/friend.controller";
const router = Router();

router.get("/find-friends", checkToken, searchUsers)

router.post("/send-friend-request", checkToken, sendFriendRequest);

router.post("/accept-friend-request", checkToken, acceptFriendRequest);

router.get("/get-all-friends", checkToken, getFriendsList);

export default router;
