import { Router } from "express";
import { login, logout, signUp } from "../controllers/auth.controller";
import { checkToken } from "../middlewares/checkAuth";

const router = Router();

router.post("/login", login);

router.post("/signup", signUp);

router.post("/logout", checkToken, logout);

export default router;
