import type { Response } from "express";

export const sendLoginResponse = (
  res: Response,
  payload: Record<string, unknown>,
) => res.status(200).json(payload);

export const sendSignUpResponse = (
  res: Response,
  payload: Record<string, unknown>,
) => res.status(201).json(payload);

export const sendLogoutResponse = (
  res: Response,
  payload: Record<string, unknown>,
) => res.status(200).json(payload);
