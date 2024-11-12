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

//Production

// router.get("/", checkToken, getAllGroups); // get all groups
// router.post("/", checkToken, createGroup); // create a new group
// router.post("/join/:groupId", checkToken, joinGroup); // join members to the group
// router.post("/leave/:groupId", checkToken, joinGroup); //leave members from the group
// router.post("/add-members", checkToken, addMember); //add members to the group
// router.post("/remove-members", checkToken, removeMember); //remove members from the group

//Need to do
// find a group by name
//find a group by id
//delete group

//Development

router.get("/findGroupByName", findGroupByName);

router.get("/", getAllGroups);

router.post("/", createGroup);

router.post("/join/:groupId", joinGroup);

router.post("/leave/:groupId", leaveGroup);

router.post("/add-members", addMember);

router.post("/remove-members", removeMember);

export default router;
