import type { NextFunction, Request, Response } from "express";
import { suggestionsResponse } from "./suggestions.mapper";
import { SuggestionsRepository } from "./suggestions.repository";
import { SuggestionsService } from "./suggestions.service";

const repository = new SuggestionsRepository();
const service = new SuggestionsService(repository);

export const listFriendSuggestions = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const response = await service.listFriendSuggestions({
      userId: req.auth?.userId ?? "",
      limit: req.query.limit as number | undefined,
    });
    suggestionsResponse(res, response);
  } catch (error) {
    next(error);
  }
};
