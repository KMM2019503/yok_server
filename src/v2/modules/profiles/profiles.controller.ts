import type { NextFunction, Request, Response } from "express";
import { profileResponse } from "./profiles.mapper";
import { ProfilesRepository } from "./profiles.repository";
import { ProfilesService } from "./profiles.service";
import type { UpdateMyProfileBody } from "./profiles.types";

const repository = new ProfilesRepository();
const service = new ProfilesService(repository);

export const submitProfileStory = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const body = req.body as { story: string };
    const response = await service.submitStory({
      userId: req.auth?.userId ?? "",
      story: body.story,
    });
    profileResponse(res, response);
  } catch (error) {
    next(error);
  }
};

export const confirmProfileTags = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const body = req.body as { tags: string[] };
    const response = await service.confirmTags({
      userId: req.auth?.userId ?? "",
      tags: body.tags,
    });
    profileResponse(res, response);
  } catch (error) {
    next(error);
  }
};

export const skipProfile = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const response = await service.skip({
      userId: req.auth?.userId ?? "",
    });
    profileResponse(res, response);
  } catch (error) {
    next(error);
  }
};

export const getMyProfile = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const response = await service.getMine(req.auth?.userId ?? "");
    profileResponse(res, response);
  } catch (error) {
    next(error);
  }
};

export const updateMyProfile = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const response = await service.updateMine({
      userId: req.auth?.userId ?? "",
      body: req.body as UpdateMyProfileBody,
    });
    profileResponse(res, response);
  } catch (error) {
    next(error);
  }
};

export const getPublicProfile = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const response = await service.getPublic(String(req.params.userId ?? ""));
    profileResponse(res, response);
  } catch (error) {
    next(error);
  }
};
