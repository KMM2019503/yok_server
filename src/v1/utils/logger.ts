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
  level: "debug",
  format: format.combine(
    format.colorize(), // Enable colorization
    format.timestamp(),
    format.printf(({ timestamp, level, message }) => {
      // Check if message is an object, then serialize it to JSON
      const logMessage =
        typeof message === "object"
          ? JSON.stringify(message, null, 2)
          : message;
      return `${timestamp} [${level}]: ${logMessage}`;
    })
  ),
  transports: [
    new transports.Console(), // Log to console
  ],
});

export default logger;
