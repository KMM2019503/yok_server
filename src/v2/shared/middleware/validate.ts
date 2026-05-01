import type { NextFunction, Request, Response } from "express";
import type { z} from "zod";
import { type ZodIssue } from "zod";
import { ValidationError } from "../errors";

const formatIssues = (issues: ZodIssue[]) =>
  issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
  }));

type ParsedRequest = {
  body: unknown;
  params: unknown;
  query: unknown;
};

export const validate = (schema: z.ZodType<ParsedRequest>) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query,
    });

    if (!result.success) {
      return next(new ValidationError("Validation failed", formatIssues(result.error.issues)));
    }

    req.body = result.data.body;
    req.params = result.data.params as Request["params"];
    req.query = result.data.query as Request["query"];

    next();
  };
};
