/**
 * Runtime configuration for talking to the Yok backend.
 *
 * The backend (yok_server) serves the v2 API and Socket.IO on the same origin.
 * Defaults match the backend's local setup (PORT=9999, CORS origin :3000).
 */
const API_ORIGIN =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:9999";

export const env = {
  /** Origin of the backend, e.g. http://localhost:9999 */
  apiOrigin: API_ORIGIN,
  /** Base URL for the versioned REST API. */
  apiBase: `${API_ORIGIN}/v2`,
  /** Socket.IO endpoint (same origin as the API). */
  socketUrl: API_ORIGIN,
  /**
   * Optional gate token for /v2 routes. Only needed if the backend sets
   * V2_INTERNAL_TOKEN. Sent as the `x-internal-v2-token` header.
   */
  internalToken: process.env.NEXT_PUBLIC_V2_INTERNAL_TOKEN ?? "",
} as const;
