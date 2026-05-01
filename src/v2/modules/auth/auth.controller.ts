import type { Request, Response } from "express";
import logger from "../../utils/logger";
import { AuthRepository } from "./auth.repository";
import { AuthService } from "./auth.service";
import { sendLoginResponse, sendLogoutResponse, sendSignUpResponse } from "./auth.mapper";
import type { LoginBody, SignUpBody } from "./auth.types";

const repository = new AuthRepository();
const service = new AuthService(repository);

export const login = async (req: Request, res: Response) => {
  try {
    const response = await service.login(req.body as LoginBody);

    res.cookie("token", response.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: "strict",
    });

    sendLoginResponse(res, response.payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    logger.error("Error occurred during login:", error);
    res.status(500).json({ error: message });
  }
};

export const signUp = async (req: Request, res: Response) => {
  try {
    const response = await service.signUp(req.body as SignUpBody);

    res.cookie("token", response.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 3 * 60 * 1000,
      sameSite: "strict",
    });

    sendSignUpResponse(res, response.payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    logger.error("Error occurred during sign-up:", error);
    res.status(500).json({ error: message });
  }
};

export const logout = (_req: Request, res: Response) => {
  try {
    const payload = service.logout();
    res.clearCookie("token");
    sendLogoutResponse(res, payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    logger.error("Error occurred during logout:", error);
    res.status(500).json({ error: message });
  }
};
