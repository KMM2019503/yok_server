import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { env } from "../../config/env";

type JwtPayload = {
  userId: string;
  userPassword?: string;
};

export const requireAuth: RequestHandler = (req, res, next) => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      res
        .status(401)
        .json({ success: false, message: "Unauthorized: No token provided" });
      return;
    }

    const decoded = jwt.verify(token, env.JWT_SECRET_KEY) as JwtPayload;

    req.auth = { userId: decoded.userId };
    req.userid = decoded.userId;

    next();
  } catch {
    res
      .status(401)
      .json({ success: false, message: "Invalid or expired token" });
  }
};
