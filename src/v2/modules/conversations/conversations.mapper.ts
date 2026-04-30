import type { Response } from "express";

export const sendConversationResponse = (
  res: Response,
  payload: Record<string, unknown>,
) => res.status(200).json(payload);
