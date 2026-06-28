import { Router } from "express";
import {
  addFcmToken,
  deleteUser,
  findNearbyUsers,
  getUserByPhoneNumber,
  removeFcmToken,
  removeLocation,
  searchUsers,
  updateLocation,
  updateUser,
} from "./users.controller";
import { requireAuth } from "../../shared/middleware/auth";
import { validate } from "../../shared/middleware/validate";
import {
  deleteUserSchema,
  fcmTokenSchema,
  findUserByPhoneSchema,
  nearbyUsersSchema,
  removeLocationSchema,
  searchUsersSchema,
  updateLocationSchema,
  updateUserSchema,
} from "./users.schema";

const router = Router();

router.get("/search", requireAuth, validate(searchUsersSchema), searchUsers);
router.get("/nearby", requireAuth, validate(nearbyUsersSchema), findNearbyUsers);
router.post("/location", requireAuth, validate(updateLocationSchema), updateLocation);
router.delete("/location", requireAuth, validate(removeLocationSchema), removeLocation);
router.get("/findUserByPhoneNumber/:phoneNumber", validate(findUserByPhoneSchema), getUserByPhoneNumber);
router.post("/update", requireAuth, validate(updateUserSchema), updateUser);
router.delete("/delete/:userId", requireAuth, validate(deleteUserSchema), deleteUser);
router.post("/adding-fcm-token", requireAuth, validate(fcmTokenSchema), addFcmToken);
router.post("/removing-fcm-token", requireAuth, validate(fcmTokenSchema), removeFcmToken);

export default router;
