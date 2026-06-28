import { env } from "./env";
import type {
  AuthResponse,
  Conversation,
  ConversationMessagesResponse,
  ConversationsResponse,
  Message,
  UserSearchResult,
} from "./types";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  query?: Record<string, string | number | undefined>;
  signal?: AbortSignal;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, query, signal } = options;

  const url = new URL(`${env.apiBase}${path}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== "") url.searchParams.set(key, String(value));
    }
  }

  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (env.internalToken) headers["x-internal-v2-token"] = env.internalToken;

  let res: Response;
  try {
    res = await fetch(url.toString(), {
      method,
      headers,
      // httpOnly `token` cookie auth — must include credentials on every call.
      credentials: "include",
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch {
    throw new ApiError("Network error — is the backend running on :9999?", 0);
  }

  const text = await res.text();
  const data = text ? safeJson(text) : null;

  if (!res.ok) {
    const errData = data as { error?: string; message?: string } | null;
    const message =
      errData?.error ||
      errData?.message ||
      (res.status === 401 ? "Not authenticated" : `Request failed (${res.status})`);
    throw new ApiError(message, res.status);
  }

  return data as T;
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export const api = {
  /* ---- Auth ---- */
  login: (input: { email: string; password: string }) =>
    request<AuthResponse>("/login", { method: "POST", body: input }),

  signup: (input: {
    userName: string;
    email: string;
    passwords: string;
    profilePictureUrl?: string;
    gender?: "M" | "F" | "T";
    dob?: string;
  }) => request<AuthResponse>("/signup", { method: "POST", body: input }),

  logout: () => request<{ success: boolean }>("/logout"),

  checkAuth: () => request<{ success: boolean; message: string }>("/checkAuth"),

  /* ---- Users ---- */
  searchUsers: (q: string, signal?: AbortSignal) =>
    request<{ success: boolean; users: UserSearchResult[] }>("/users/search", {
      query: { q },
      signal,
    }),

  /* ---- Location / Nearby ---- */
  // Publish the caller's current location so others can discover them.
  updateLocation: (input: { latitude: number; longitude: number }) =>
    request<{ success: boolean; message: string }>("/users/location", {
      method: "POST",
      body: input,
    }),

  // Find users currently sharing a location within `maxDistance` km.
  findNearby: (
    input: { latitude: number; longitude: number; maxDistance: number },
    signal?: AbortSignal,
  ) =>
    request<{ success: boolean; message?: string; users: UserSearchResult[] }>(
      "/users/nearby",
      {
        query: {
          latitude: input.latitude,
          longitude: input.longitude,
          maxDistance: input.maxDistance,
        },
        signal,
      },
    ),

  // Stop sharing the caller's location (removes them from the nearby pool).
  removeLocation: () =>
    request<{ success: boolean; message: string }>("/users/location", {
      method: "DELETE",
    }),

  /* ---- Conversations (DM) ---- */
  getConversations: (cursorId?: string) =>
    request<ConversationsResponse>("/conversations/get-conversation", {
      query: { cursorId },
    }),

  getConversationMessages: (
    conversationId: string,
    params?: { cursorId?: string; take?: number },
  ) =>
    request<ConversationMessagesResponse>(
      `/conversations/get-messages/${conversationId}`,
      { query: { cursorId: params?.cursorId, take: params?.take } },
    ),

  /* ---- Messages ---- */
  sendDirectMessage: (input: {
    content: string;
    receiverId: string;
    conversationId?: string;
    photoUrl?: string[];
    fileUrls?: string[];
  }) =>
    request<{
      success?: boolean;
      message?: Message;
      conversation?: Conversation;
    }>("/messages/direct-message", { method: "POST", body: input }),
};
