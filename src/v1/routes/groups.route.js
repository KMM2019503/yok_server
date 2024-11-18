import { Router } from "express";

import { checkToken } from "../middlewares/checkAuth";
import {
  addMember,
  createGroup,
  findGroupByName,
  getAllGroups,
  joinGroup,
  leaveGroup,
  removeMember,
} from "../controllers/groups.controller";

const router = Router();

router.use(checkToken);

router.get("/findGroupByName", findGroupByName);

//get all groups by user id
router.get("/", getAllGroups);

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

//todo
//find a group by id
//delete group

export default router;
