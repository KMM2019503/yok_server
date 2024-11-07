import { Router } from "express";

import { checkToken } from "../middlewares/checkAuth";
import {
  createGroup,
  getAllGroups,
  joinGroup,
} from "../controllers/groups.controller";

const router = Router();

// get all groups
// router.get("/",checkToken, getAllGroups);
router.get("/", getAllGroups);

// find a group by name
//find a group by id

// create a new group
// router.post('/', checkToken, createGroup)
router.post("/", createGroup);

// join members to the group
// router.post("/join/:groupId", checkToken, joinGroup);
router.post("/join/:groupId", joinGroup);

//leave members from the group
//add members to the group
//remove members from the group

//delete group

export default router;
