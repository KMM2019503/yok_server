import { Router } from "express";
import { requireAuth } from "../../shared/middleware/auth";
import { validate } from "../../shared/middleware/validate";
import {
  confirmProfileTags,
  getMyProfile,
  getPublicProfile,
  skipProfile,
  submitProfileStory,
  updateMyProfile,
} from "./profiles.controller";
import {
  confirmProfileTagsSchema,
  getMyProfileSchema,
  profileUserIdSchema,
  skipProfileSchema,
  submitProfileStorySchema,
  updateMyProfileSchema,
} from "./profiles.schema";

const router = Router();

router.post("/story", requireAuth, validate(submitProfileStorySchema), submitProfileStory);
router.post("/skip", requireAuth, validate(skipProfileSchema), skipProfile);
router.put("/tags", requireAuth, validate(confirmProfileTagsSchema), confirmProfileTags);
router.get("/me", requireAuth, validate(getMyProfileSchema), getMyProfile);
router.put("/me", requireAuth, validate(updateMyProfileSchema), updateMyProfile);
router.get("/:userId", requireAuth, validate(profileUserIdSchema), getPublicProfile);

export default router;
