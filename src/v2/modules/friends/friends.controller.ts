import type { NextFunction, Request, Response } from "express";
import { FriendsRepository } from "./friends.repository";
import { FriendsService } from "./friends.service";
import {
  friendRequestActionResponse,
  friendshipStatusResponse,
  listResponse,
  sendFriendRequestResponse,
  unfriendResponse,
} from "./friends.mapper";

const repository = new FriendsRepository();
const service = new FriendsService(repository);

const pagination = (req: Request) => ({
  cursor: req.query.cursor as string | undefined,
  limit: req.query.limit as unknown as number | undefined,
});

export const sendFriendRequest = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const body = req.body as { receiverId: string };
    const response = await service.sendRequest({
      userId: req.auth?.userId ?? "",
      receiverId: body.receiverId,
    });
    sendFriendRequestResponse(res, response);
  } catch (error) {
    next(error);
  }
};

export const listIncomingRequests = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const response = await service.listIncoming({
      userId: req.auth?.userId ?? "",
      ...pagination(req),
    });
    listResponse(res, response);
  } catch (error) {
    next(error);
  }
};

export const listOutgoingRequests = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const response = await service.listOutgoing({
      userId: req.auth?.userId ?? "",
      ...pagination(req),
    });
    listResponse(res, response);
  } catch (error) {
    next(error);
  }
};

export const acceptFriendRequest = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const response = await service.accept({
      userId: req.auth?.userId ?? "",
      requestId: req.params.requestId,
    });
    friendRequestActionResponse(res, response);
  } catch (error) {
    next(error);
  }
};

export const rejectFriendRequest = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const response = await service.reject({
      userId: req.auth?.userId ?? "",
      requestId: req.params.requestId,
    });
    friendRequestActionResponse(res, response);
  } catch (error) {
    next(error);
  }
};

export const cancelFriendRequest = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const response = await service.cancel({
      userId: req.auth?.userId ?? "",
      requestId: req.params.requestId,
    });
    friendRequestActionResponse(res, response);
  } catch (error) {
    next(error);
  }
};

export const listFriends = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const response = await service.listFriends({
      userId: req.auth?.userId ?? "",
      q: req.query.q as string | undefined,
      ...pagination(req),
    });
    listResponse(res, response);
  } catch (error) {
    next(error);
  }
};

export const unfriend = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const response = await service.unfriend({
      userId: req.auth?.userId ?? "",
      friendId: req.params.friendId,
    });
    unfriendResponse(res, response);
  } catch (error) {
    next(error);
  }
};

export const getFriendshipStatus = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const response = await service.getStatus({
      userId: req.auth?.userId ?? "",
      targetUserId: req.params.userId,
    });
    friendshipStatusResponse(res, response);
  } catch (error) {
    next(error);
  }
};
