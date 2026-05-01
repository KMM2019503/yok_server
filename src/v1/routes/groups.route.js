import { Router } from "express";

import { checkToken } from "../middlewares/checkAuth";
import {
  addMember,
  createGroup,
  findGroupByName,
  getAllGroups,
  getGroup,
  getGroupMessages,
  getLatestMessagesInGroup,
  joinGroup,
  leaveGroup,
  removeMember,
} from "../controllers/groups.controller";

const router = Router();

// router.use(checkToken);

router.get("/:groupId", getGroup);

router.get("/findGroupByName", findGroupByName);

//get all groups by user id
router.get("/", getAllGroups);

//get group messages by group id
router.get("/:groupId/messages", getGroupMessages);

// create group
router.post("/", createGroup);

// join members to the group if group is public
router.post("/join/:groupId", joinGroup);

// leave members from the group
router.post("/leave/:groupId", leaveGroup);

// add members to the group if user is admin
router.post("/add-members", addMember);

// remove members from the group if user is admin
router.post("/remove-members", removeMember);

router.get("/initial-groups/fetch-message", getLatestMessagesInGroup);

//todo
//find a group by id
//delete group

export default router;
