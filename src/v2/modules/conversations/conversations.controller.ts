import type { Request, Response } from "express";
import logger from "../../../v1/utils/logger";
import { ConversationsRepository } from "./conversations.repository";
import { ConversationsService } from "./conversations.service";
import { sendConversationResponse } from "./conversations.mapper";

const repository = new ConversationsRepository();
const service = new ConversationsService(repository);

export const getAllConversations = async (req: Request, res: Response) => {
  try {
    const response = await service.getAll({
      userId: req.auth?.userId ?? "",
      query: req.query,
    });

    sendConversationResponse(res, response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    logger.error("Error occurred during fetch all conversation:", {
      message,
      stack: error instanceof Error ? error.stack : undefined,
    });
    res.status(500).json({ error: message });
  }
};

export const getConversationMessages = async (req: Request, res: Response) => {
  try {
    const response = await service.getMessages({
      userId: req.auth?.userId ?? "",
      conversationId: req.params.conversationId,
      query: req.query,
    });

    sendConversationResponse(res, response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    logger.error("Error occurred during fetch conversation:", {
      message,
      stack: error instanceof Error ? error.stack : undefined,
    });
    res.status(500).json({ error: message });
  }
};

export const getLatestMessagesInConversations = async (
  req: Request,
  res: Response,
) => {
  try {
    const response = await service.getLatestMessages({
      userId: req.auth?.userId ?? "",
      query: req.query,
    });

    sendConversationResponse(res, response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Internal server error";
    logger.error("Error occurred during fetch latest message In conversation:", {
      message,
      stack: error instanceof Error ? error.stack : undefined,
    });
    res.status(500).json({ error: message });
  }
};
