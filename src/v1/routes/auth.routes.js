import { Router } from "express";
import { login, signUp } from "../controllers/auth.controller";

const router = Router();

router.post("/login", login);

router.post("/signup", signUp);

// router.post("/logout", logout);

export default router;
