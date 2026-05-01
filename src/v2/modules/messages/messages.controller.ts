import type { Request, Response } from "express";
import logger from "../../utils/logger";
import { MessagesRepository } from "./messages.repository";
import { MessagesService } from "./messages.service";
import { sendMessageResponse } from "./messages.mapper";

const repository = new MessagesRepository();
const service = new MessagesService(repository);

export const sendDmMessage = async (req: Request, res: Response) => {
  try {
    const response = await service.sendDirectMessage({
      userId: req.auth?.userId ?? "",
      body: req.body,
    });

    sendMessageResponse(res, response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    logger.error("Error occurred during Send DM Message:", {
      message,
      stack: error instanceof Error ? error.stack : undefined,
    });
    res.status(500).json({ error: message });
  }
};

export const sendChannelInvitationMessage = async (
  req: Request,
  res: Response,
) => {
  try {
    const response = await service.sendChannelInvitation({
      userId: req.auth?.userId ?? "",
      body: req.body,
    });

    sendMessageResponse(res, response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    logger.error("Error occurred during Send Channel Invitation:", {
      message,
      stack: error instanceof Error ? error.stack : undefined,
    });
    res.status(500).json({ error: message });
  }
};

export const sendGroupMessage = async (req: Request, res: Response) => {
  try {
    const response = await service.sendGroupMessage({
      userId: req.auth?.userId ?? "",
      body: req.body,
    });

    sendMessageResponse(res, response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    logger.error("Error occurred during Send Group Message:", {
      message,
      stack: error instanceof Error ? error.stack : undefined,
    });
    res.status(500).json({ error: message });
  }
};

export const sendChannelMessage = async (req: Request, res: Response) => {
  try {
    const response = await service.sendChannelMessage({
      userId: req.auth?.userId ?? "",
      body: req.body,
    });

    sendMessageResponse(res, response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    logger.error("Error occurred during Send channel Message:", {
      message,
      stack: error instanceof Error ? error.stack : undefined,
    });
    res.status(500).json({ error: message });
  }
};

export const sendChannelMessageComment = async (
  req: Request,
  res: Response,
) => {
  try {
    const response = await service.sendChannelComment({
      userId: req.auth?.userId ?? "",
      body: req.body,
    });

    sendMessageResponse(res, response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    logger.error("Error occurred during Send channel Message Comment:", {
      message,
      stack: error instanceof Error ? error.stack : undefined,
    });
    res.status(500).json({ error: message });
  }
};
