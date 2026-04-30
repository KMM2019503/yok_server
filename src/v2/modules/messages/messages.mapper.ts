import type { Response } from "express";

export const sendMessageResponse = (
  res: Response,
  payload: Record<string, unknown>,
) => res.status(201).json(payload);
