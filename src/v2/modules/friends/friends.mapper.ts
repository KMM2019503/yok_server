import type { Response } from "express";

export const sendFriendRequestResponse = (
  res: Response,
  payload: Record<string, unknown>,
) => res.status(201).json(payload);

export const friendRequestActionResponse = (
  res: Response,
  payload: Record<string, unknown>,
) => res.status(200).json(payload);

export const listResponse = (
  res: Response,
  payload: Record<string, unknown>,
) => res.status(200).json(payload);

export const friendshipStatusResponse = (
  res: Response,
  payload: Record<string, unknown>,
) => res.status(200).json(payload);

export const unfriendResponse = (
  res: Response,
  payload: Record<string, unknown>,
) => res.status(200).json(payload);
