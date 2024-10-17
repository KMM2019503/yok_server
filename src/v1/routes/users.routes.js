import { Router } from "express";
import { deleteUser, updateUser } from "../controllers/users.controller";
import { checkToken } from "../middlewares/checkAuth";
const router = Router();

router.post("/update", checkToken, updateUser);

router.delete("/delete/:userId", checkToken, deleteUser);

export default router;
