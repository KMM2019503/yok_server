import { Router } from "express";

import { checkToken } from "../middlewares/checkAuth";
import { findByName } from "../controllers/multiSearch.controller";

const router = Router();

// router.get("/",checkToken, findByName);
router.get("/", findByName);

export default router;
