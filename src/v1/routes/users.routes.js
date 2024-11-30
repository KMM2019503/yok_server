import { Router } from "express";
import {
  addFcmToken,
  deleteUser,
  getUserByPhoneNumber,
  removeFcmToken,
  updateUser,
} from "../controllers/users.controller";
import { checkToken } from "../middlewares/checkAuth";
const router = Router();

router.get("/findUserByPhoneNumber/:phoneNumber", getUserByPhoneNumber);

router.post("/update", checkToken, updateUser);

router.delete("/delete/:userId", checkToken, deleteUser);

router.post("/adding-fcm-token", addFcmToken);

router.post("/removing-fcm-token", removeFcmToken);

export default router;
