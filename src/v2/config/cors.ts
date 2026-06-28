/**
 * Allowed CORS / Socket.IO origins.
 *
 * Reads `CORS_ORIGIN` from the environment, supporting a single origin or a
 * comma-separated list (e.g. "https://app.example.com,https://www.example.com").
 * Falls back to the local web client origin for development.
 *
 * Kept dependency-free (no zod) so it can be imported from both the TS app and
 * the JS Socket.IO setup without triggering full env validation at import time.
 */
const raw = process.env.CORS_ORIGIN ?? "http://localhost:3000";

export const corsOrigins: string[] = raw
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
