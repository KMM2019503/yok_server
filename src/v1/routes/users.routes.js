import { Router } from "express";
import {
  deleteUser,
  getUserByPhoneNumber,
  updateUser,
} from "../controllers/users.controller";
import { checkToken } from "../middlewares/checkAuth";
const router = Router();

router.get(
  "/findUserByPhoneNumber/:phoneNumber",
  checkToken,
  getUserByPhoneNumber
);

router.post("/update", checkToken, updateUser);

router.delete("/delete/:userId", checkToken, deleteUser);

export default router;
