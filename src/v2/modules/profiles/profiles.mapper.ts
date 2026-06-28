import type { Response } from "express";

export const profileResponse = <T extends Record<string, unknown>>(
  res: Response,
  payload: T,
) => res.status(200).json(payload);
