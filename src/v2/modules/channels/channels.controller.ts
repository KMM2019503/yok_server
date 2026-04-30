import type { Request, Response } from "express";
import logger from "../../../v1/utils/logger";
import { ChannelsRepository } from "./channels.repository";
import { ChannelsService } from "./channels.service";
import { sendChannelResponse, withMessage } from "./channels.mapper";

const repository = new ChannelsRepository();
const service = new ChannelsService(repository);

const parseErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Internal server error";

export const createChannel = async (req: Request, res: Response) => {
  try {
    const response = await service.create({
      userId: req.auth?.userId ?? "",
      body: req.body,
    });

    sendChannelResponse(res, 201, response);
  } catch (error) {
    const message = parseErrorMessage(error);
    logger.error("Error occurred during create channel:", {
      message,
      stack: error instanceof Error ? error.stack : undefined,
    });
    res.status(500).json({ error: message, success: false });
  }
};

export const updateChannel = async (req: Request, res: Response) => {
  try {
    const response = await service.update({
      userId: req.auth?.userId ?? "",
      channelId: req.channelId ?? req.params.channelId,
      body: req.body,
    });

    sendChannelResponse(res, 200, response);
  } catch (error) {
    const message = parseErrorMessage(error);
    logger.error("Error occurred during user update:", {
      message,
      stack: error instanceof Error ? error.stack : undefined,
    });
    res.status(500).json({ error: message, success: false });
  }
};

export const getAllChannels = async (req: Request, res: Response) => {
  try {
    const response = await service.getAll({
      userId: req.auth?.userId ?? "",
      body: {},
    });

    sendChannelResponse(res, 200, response);
  } catch (error) {
    const message = parseErrorMessage(error);
    logger.error("Error occurred during user update:", {
      message,
      stack: error instanceof Error ? error.stack : undefined,
    });
    res.status(500).json({ error: message, success: false });
  }
};

export const getChannelMessagesByChannelId = async (
  req: Request,
  res: Response,
) => {
  try {
    const response = await service.getMessages({
      userId: req.auth?.userId ?? "",
      channelId: req.params.channelId,
      query: req.query,
    });

    sendChannelResponse(res, 200, response);
  } catch (error) {
    const message = parseErrorMessage(error);
    logger.error("Error occurred during get Messages by channel id:", {
      message,
      stack: error instanceof Error ? error.stack : undefined,
    });
    res.status(500).json({ error: message, success: false });
  }
};

export const addAdminToChannel = async (req: Request, res: Response) => {
  try {
    const response = await service.addAdmin({
      userId: req.auth?.userId ?? "",
      channelId: req.channelId ?? req.params.channelId,
      body: req.body,
    });

    sendChannelResponse(
      res,
      201,
      withMessage("Admin added successfully", response),
    );
  } catch (error) {
    const message = parseErrorMessage(error);
    logger.error("Error occurred while adding admin to the channel:", {
      message,
      stack: error instanceof Error ? error.stack : undefined,
    });
    res.status(500).json({ error: message, success: false });
  }
};

export const removeAdminFromChannel = async (req: Request, res: Response) => {
  try {
    const response = await service.removeAdmin({
      userId: req.auth?.userId ?? "",
      channelId: req.channelId ?? req.params.channelId,
      body: req.body,
    });

    sendChannelResponse(
      res,
      200,
      withMessage("Admin removed successfully", response),
    );
  } catch (error) {
    const message = parseErrorMessage(error);
    logger.error("Error occurred while removing admin from the channel:", {
      message,
      stack: error instanceof Error ? error.stack : undefined,
    });
    res.status(500).json({ error: message, success: false });
  }
};

export const deleteChannel = async (req: Request, res: Response) => {
  try {
    const response = await service.delete({
      userId: req.auth?.userId ?? "",
      channelId: req.params.channelId,
    });

    sendChannelResponse(
      res,
      200,
      withMessage("Channel deleted successfully", response),
    );
  } catch (error) {
    const message = parseErrorMessage(error);
    logger.error("Error occurred while deleting channel:", {
      message,
      stack: error instanceof Error ? error.stack : undefined,
    });
    res.status(500).json({ error: message, success: false });
  }
};

export const addMemberToChannel = async (req: Request, res: Response) => {
  try {
    const response = await service.addMember({
      userId: req.auth?.userId ?? "",
      body: req.body,
    });

    sendChannelResponse(
      res,
      201,
      withMessage("add member successfully", response),
    );
  } catch (error) {
    const message = parseErrorMessage(error);
    logger.error("Error occurred while adding members to the channel:", {
      message,
      stack: error instanceof Error ? error.stack : undefined,
    });
    res.status(500).json({ error: message, success: false });
  }
};

export const removeMemberFromChannel = async (req: Request, res: Response) => {
  try {
    const response = await service.removeMember({
      userId: req.auth?.userId ?? "",
      body: req.body,
    });

    sendChannelResponse(
      res,
      201,
      withMessage("remove member successfully", response),
    );
  } catch (error) {
    const message = parseErrorMessage(error);
    logger.error("Error occurred while removing members from the channel:", {
      message,
      stack: error instanceof Error ? error.stack : undefined,
    });
    res.status(500).json({ error: message, success: false });
  }
};

export const joinMemberToChannel = async (req: Request, res: Response) => {
  try {
    const response = await service.joinMember({
      userId: req.auth?.userId ?? "",
      body: req.body,
    });

    sendChannelResponse(
      res,
      201,
      withMessage("join member successfully", response),
    );
  } catch (error) {
    const message = parseErrorMessage(error);
    logger.error("Error occurred while joining members to the channel:", {
      message,
      stack: error instanceof Error ? error.stack : undefined,
    });
    res.status(500).json({ error: message, success: false });
  }
};

export const leaveMemberFromChannel = async (req: Request, res: Response) => {
  try {
    const response = await service.leaveMember({
      userId: req.auth?.userId ?? "",
      body: req.body,
    });

    sendChannelResponse(
      res,
      201,
      withMessage("leave member successfully", response),
    );
  } catch (error) {
    const message = parseErrorMessage(error);
    logger.error("Error occurred while leaving members from the channel:", {
      message,
      stack: error instanceof Error ? error.stack : undefined,
    });
    res.status(500).json({ error: message, success: false });
  }
};

export const getChannel = async (req: Request, res: Response) => {
  try {
    const response = await service.getChannel({
      userId: req.auth?.userId ?? "",
      channelId: req.params.channelId,
    });

    sendChannelResponse(res, 201, response);
  } catch (error) {
    const message = parseErrorMessage(error);
    logger.error("Error occurred in get chnnel:", {
      message,
      stack: error instanceof Error ? error.stack : undefined,
    });
    res.status(500).json({ error: message, success: false });
  }
};

export const getLatestMessagesInChannel = async (
  req: Request,
  res: Response,
) => {
  try {
    const response = await service.getLatestMessages({
      userId: req.auth?.userId ?? "",
      body: {},
      query: req.query,
    });

    sendChannelResponse(res, 200, response);
  } catch (error) {
    const message = parseErrorMessage(error);
    logger.error("Error occurred during fetch latest message In channels:", {
      message,
      stack: error instanceof Error ? error.stack : undefined,
    });
    res.status(500).json({ error: message, success: false });
  }
};

export const getComments = async (req: Request, res: Response) => {
  try {
    const response = await service.getComments({
      userId: req.auth?.userId ?? "",
      body: {},
      query: req.query,
    });

    sendChannelResponse(res, 200, response);
  } catch (error) {
    const message = parseErrorMessage(error);
    logger.error("Error occurred during fetch comments:", {
      message,
      stack: error instanceof Error ? error.stack : undefined,
    });
    res.status(500).json({ error: message, success: false });
  }
};

export const joinChannelByInvitation = async (req: Request, res: Response) => {
  try {
    const response = await service.joinByInvitation({
      userId: req.auth?.userId ?? "",
      body: req.body,
    });

    sendChannelResponse(res, 200, response);
  } catch (error) {
    const message = parseErrorMessage(error);
    logger.error("Error occurred Join Channel By Invitation:", {
      message,
      stack: error instanceof Error ? error.stack : undefined,
    });
    res.status(500).json({ error: message, success: false });
  }
};
