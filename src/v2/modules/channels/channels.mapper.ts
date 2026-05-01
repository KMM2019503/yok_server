import type { Response } from "express";

export const sendChannelResponse = (
  res: Response,
  status: number,
  payload: Record<string, unknown>,
) => res.status(status).json(payload);

export const withMessage = (
  message: string,
  data: Record<string, unknown>,
): Record<string, unknown> => ({
  message,
  data,
});
