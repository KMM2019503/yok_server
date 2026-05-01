import type { Response } from "express";

export const sendUpdateUserResponse = (
  res: Response,
  payload: Record<string, unknown>,
) => res.status(200).json(payload);

export const sendDeleteUserResponse = (
  res: Response,
  payload: Record<string, unknown>,
) => res.status(200).json(payload);

export const sendFindUserResponse = (
  res: Response,
  payload: Record<string, unknown>,
) => res.status(200).json(payload);

export const sendAddFcmResponse = (
  res: Response,
  payload: Record<string, unknown>,
) => res.status(201).json(payload);

export const sendRemoveFcmResponse = (
  res: Response,
  payload: Record<string, unknown>,
) => res.status(201).json(payload);
