import { Router } from "express";
import {
  addFcmToken,
  deleteUser,
  getUserByPhoneNumber,
  removeFcmToken,
  updateUser,
} from "./users.controller";
import { requireAuth } from "../../shared/middleware/auth";
import { validate } from "../../shared/middleware/validate";
import {
  deleteUserSchema,
  fcmTokenSchema,
  findUserByPhoneSchema,
  updateUserSchema,
} from "./users.schema";

const router = Router();

router.get("/findUserByPhoneNumber/:phoneNumber", validate(findUserByPhoneSchema), getUserByPhoneNumber);
router.post("/update", requireAuth, validate(updateUserSchema), updateUser);
router.delete("/delete/:userId", requireAuth, validate(deleteUserSchema), deleteUser);
router.post("/adding-fcm-token", requireAuth, validate(fcmTokenSchema), addFcmToken);
router.post("/removing-fcm-token", requireAuth, validate(fcmTokenSchema), removeFcmToken);

export default router;
