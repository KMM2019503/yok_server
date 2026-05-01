import { Router } from "express";
import { login, logout, signUp } from "../controllers/auth.controller";
import { checkToken } from "../middlewares/checkAuth";

const router = Router();

router.post("/login", login);

router.post("/signup", signUp);

router.get("/logout", checkToken, logout);

router.get("/checkAuth", checkToken, (req, res) => {
    console.log("🚀 ~ router.get ~ req:", req.userId)
    
    res.status(200).json({
        success: true,
        message: "User is authenticated",
    });
})

export default router;
