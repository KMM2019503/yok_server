import { Router } from "express";
import { requireAuth } from "../../shared/middleware/auth";
import { validate } from "../../shared/middleware/validate";
import { listFriendSuggestions } from "./suggestions.controller";
import { listFriendSuggestionsSchema } from "./suggestions.schema";

const router = Router();

router.get(
  "/friends",
  requireAuth,
  validate(listFriendSuggestionsSchema),
  listFriendSuggestions,
);

export default router;
