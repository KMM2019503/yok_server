import { Router } from "express";
import { login, logout, signUp } from "./auth.controller";
import { requireAuth } from "../../shared/middleware/auth";
import { validate } from "../../shared/middleware/validate";
import { loginSchema, signUpSchema } from "./auth.schema";

const router = Router();

router.post("/login", validate(loginSchema), login);
router.post("/signup", validate(signUpSchema), signUp);

router.get("/logout", requireAuth, logout);

router.get("/checkAuth", requireAuth, (_req, res) => {
  res.status(200).json({
    success: true,
    message: "User is authenticated",
  });
});

export default router;
