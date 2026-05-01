import { type Request, type Response, type NextFunction } from "express";
import logger from "../utils/logger";

// Define sensitive keys that should be sanitized before logging
const SENSITIVE_FIELDS = ["password", "token", "authorization"];

const sanitizeObject = (obj: Record<string, any>) => {
  const sanitized = { ...obj };
  SENSITIVE_FIELDS.forEach((field) => {
    if (sanitized[field]) {
      sanitized[field] = "[REDACTED]";
    }
  });
  return sanitized;
};

const httpLogger = (req: Request, res: Response, next: NextFunction) => {
  const { method, url, headers, query, body } = req;

  // Sanitize the headers and body to avoid logging sensitive information
  const sanitizedHeaders = sanitizeObject(headers);
  const sanitizedBody = sanitizeObject(body);

  // Log the request details, including origin
  const origin = headers.origin || "unknown origin";
  logger.http(`Request: ${method} ${url} from ${origin}`);
  logger.http(`Headers: ${JSON.stringify(sanitizedHeaders)}`);
  logger.http(`Query Params: ${JSON.stringify(query)}`);

  // Log the body only for non-GET requests (e.g., POST, PUT)
  if (method !== "GET") {
    logger.http(`Body: ${JSON.stringify(sanitizedBody)}`);
  }

  next(); // Pass control to the next middleware or route handler
};

export default httpLogger;
