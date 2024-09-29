// src/logger.ts
import { createLogger, format, transports } from "winston";

// Define colors for the different log levels
const colors = {
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  debug: "blue",
};

// Add colors to Winston
format.colorize.apply(colors);

const logger = createLogger({
  level: "info",
  format: format.combine(
    format.colorize(), // Enable colorization
    format.timestamp(),
    format.printf(({ timestamp, level, message }) => {
      return `${timestamp} [${level}]: ${message}`;
    })
  ),
  transports: [
    new transports.Console(), // Log to console
  ],
});

export default logger;
