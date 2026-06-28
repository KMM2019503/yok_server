import type { Request, Response } from "express";
import logger from "../../utils/logger";
import { UsersRepository } from "./users.repository";
import { UsersService } from "./users.service";
import {
  sendAddFcmResponse,
  sendDeleteUserResponse,
  sendFindUserResponse,
  sendNearbyUsersResponse,
  sendRemoveFcmResponse,
  sendRemoveLocationResponse,
  sendSearchUsersResponse,
  sendUpdateLocationResponse,
  sendUpdateUserResponse,
} from "./users.mapper";

const repository = new UsersRepository();
const service = new UsersService(repository);

export const searchUsers = async (req: Request, res: Response) => {
  try {
    const response = await service.search({
      userId: req.auth?.userId ?? "",
      query: String(req.query.q ?? ""),
    });

    sendSearchUsersResponse(res, response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    logger.error("Error occurred during user search:", {
      message,
      stack: error instanceof Error ? error.stack : undefined,
    });
    res.status(500).json({ error: message, success: false });
  }
};

export const updateLocation = async (req: Request, res: Response) => {
  try {
    const body = req.body as { latitude: number; longitude: number };
    const response = await service.updateLocation({
      userId: req.auth?.userId ?? "",
      latitude: Number(body.latitude),
      longitude: Number(body.longitude),
    });

    sendUpdateLocationResponse(res, response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    logger.error("Error occurred updating user location:", {
      message,
      stack: error instanceof Error ? error.stack : undefined,
    });
    res.status(500).json({ error: message, success: false });
  }
};

export const findNearbyUsers = async (req: Request, res: Response) => {
  try {
    const query = req.query as unknown as {
      latitude: number;
      longitude: number;
      maxDistance?: number;
    };
    const response = await service.findNearby({
      userId: req.auth?.userId ?? "",
      latitude: Number(query.latitude),
      longitude: Number(query.longitude),
      maxDistance: Number(query.maxDistance ?? 5),
    });

    sendNearbyUsersResponse(res, response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    logger.error("Error occurred finding nearby users:", {
      message,
      stack: error instanceof Error ? error.stack : undefined,
    });
    res.status(500).json({ error: message, success: false });
  }
};

export const removeLocation = async (req: Request, res: Response) => {
  try {
    const response = await service.removeLocation({
      userId: req.auth?.userId ?? "",
    });

    sendRemoveLocationResponse(res, response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    logger.error("Error occurred removing user location:", {
      message,
      stack: error instanceof Error ? error.stack : undefined,
    });
    res.status(500).json({ error: message, success: false });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const response = await service.update({
      userId: req.auth?.userId ?? "",
      body: req.body,
    });

    sendUpdateUserResponse(res, response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    logger.error("Error occurred during user update:", {
      message,
      stack: error instanceof Error ? error.stack : undefined,
    });
    res.status(500).json({ error: message, success: false });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const response = await service.delete({
      userId: req.auth?.userId ?? "",
      targetUserId: req.params.userId,
    });

    sendDeleteUserResponse(res, response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    logger.error("Error occurred during user update:", {
      message,
      stack: error instanceof Error ? error.stack : undefined,
    });
    res.status(500).json({ error: message, success: false });
  }
};

export const getUserByPhoneNumber = async (req: Request, res: Response) => {
  try {
    const response = await service.findByPhone({
      phoneNumber: req.params.phoneNumber,
    });

    sendFindUserResponse(res, response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    logger.error("Error occurred fetching user by PhoneNumber:", {
      message,
      stack: error instanceof Error ? error.stack : undefined,
    });

    const statusCode =
      typeof error === "object" && error !== null && "statusCode" in error
        ? Number((error).statusCode)
        : undefined;

    const errorCode =
      typeof error === "object" && error !== null && "errorCode" in error
        ? (error).errorCode
        : undefined;

    res.status(500).json({
      error: {
        message,
        statusCode,
        errorCode,
      },
      success: false,
    });
  }
};

export const addFcmToken = async (req: Request, res: Response) => {
  try {
    const response = await service.addFcmToken({
      userId: req.auth?.userId ?? "",
      fcmToken:
        typeof req.body === "object" &&
        req.body !== null &&
        "fcmToken" in req.body
          ? String((req.body as { fcmToken?: unknown }).fcmToken ?? "")
          : "",
    });

    sendAddFcmResponse(res, response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    logger.error("Error occurred adding Fcm Token:", {
      message,
      stack: error instanceof Error ? error.stack : undefined,
    });
    res.status(500).json({
      ErrorMessage: message,
      success: false,
    });
  }
};

export const removeFcmToken = async (req: Request, res: Response) => {
  try {
    const response = await service.removeFcmToken({
      userId: req.auth?.userId ?? "",
      fcmToken:
        typeof req.body === "object" &&
        req.body !== null &&
        "fcmToken" in req.body
          ? String((req.body as { fcmToken?: unknown }).fcmToken ?? "")
          : "",
    });

    sendRemoveFcmResponse(res, response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    logger.error("Error occurred removing Fcm Token:", {
      message,
      stack: error instanceof Error ? error.stack : undefined,
    });
    res.status(500).json({
      ErrorMessage: message,
      success: false,
    });
  }
};
