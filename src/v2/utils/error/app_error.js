import { ErrorCodes } from "./error_codes";

export class AppError extends Error {
  constructor(message, statusCode, errorCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.errorCode = errorCode ?? ErrorCodes.UserNotFound;

    // Capture stack trace for debugging
    Error.captureStackTrace(this, this.constructor);
  }
}
