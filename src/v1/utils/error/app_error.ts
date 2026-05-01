// src/utils/AppError.ts

import { ErrorCodes } from "./error_codes";

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly errorCode: ErrorCodes; // Use ErrorCodes enum for type safety

  constructor(message: string, statusCode: number, errorCode: ErrorCodes) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.errorCode = errorCode;

    // Capture stack trace for debugging
    Error.captureStackTrace(this, this.constructor);
  }
}
