import { io, type Socket } from "socket.io-client";
import { env } from "./env";
import type {
  IncomingNewMessagePayload,
  Message,
  User,
} from "./types";

/**
 * Events the server emits to us, and the ones we emit to it.
 * Mirrors socket/Socket.js + src/v2/services/message.services.ts.
 */
export interface ServerToClientEvents {
  userData: (user: User | null) => void;
  pullOnlineUsers: (onlineUserIds: string[]) => void;
  incomingNewMessage: (payload: IncomingNewMessagePayload) => void;
  messagesStatusUpdated: (messages: Message[]) => void;
}

export interface ClientToServerEvents {
  reconnectUser: (data: { userId: string }) => void;
  pullUserData: () => void;
  markMessagesAsRead: (data: { messageIds: string[]; userId: string }) => void;
}

export type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: AppSocket | null = null;

/** Lazily create the shared socket connection (cookie auth via handshake). */
export function getSocket(): AppSocket {
  if (socket) return socket;

  socket = io(env.socketUrl, {
    withCredentials: true,
    autoConnect: false,
    transports: ["websocket", "polling"],
  });

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}
