/**
 * Domain types mirroring the Yok backend (v2) response shapes.
 * Kept intentionally lean for the DM MVP; extend as more modules are wired.
 */

export type Gender = "M" | "F" | "T";

export type MessageStatusValue = "SENT" | "READ";

export type MessageType =
  | "STANDARD"
  | "CHANNEL_INVITATION"
  | "FORWARD"
  | "REPLY";

/** Full user object returned by login/signup. */
export interface User {
  id: string;
  email: string;
  userUniqueID: string;
  userName: string;
  gender?: Gender | null;
  dateOfBirth?: string | null;
  profilePictureUrl?: string | null;
  lastActiveAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Lightweight user as embedded in conversation members. */
export interface UserSummary {
  id: string;
  userName: string;
  profilePictureUrl?: string | null;
  lastActiveAt?: string | null;
}

/** A user returned by the search endpoint. */
export interface UserSearchResult {
  id: string;
  userName: string;
  email: string;
  userUniqueID?: string;
  profilePictureUrl?: string | null;
  lastActiveAt?: string | null;
}

/** A user returned by the location-based "nearby" endpoint (same shape as search). */
export type NearbyUser = UserSearchResult;

export interface SeenStatus {
  status: MessageStatusValue;
  seenUserIds: string[];
}

export interface ConversationMember {
  id: string;
  userId: string;
  conversationId: string;
  joinedAt: string;
  user: UserSummary;
}

export interface LastMessage {
  content: string;
  senderId: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  members: ConversationMember[];
  lastMessage?: LastMessage | null;
  createdAt: string;
  updatedAt: string;
  lastActivity: string;
}

export interface Message {
  id: string;
  content: string;
  senderId: string;
  status: SeenStatus;
  photoUrl?: string[];
  fileUrls?: string[];
  messageType?: MessageType;
  conversationId?: string | null;
  createdAt: string;
  updatedAt?: string;
  /** Present in some payloads (latest-messages embeds the sender). */
  sender?: UserSummary;
}

/* ----- API response envelopes ----- */

export interface AuthResponse {
  success: boolean;
  user: User;
}

export interface ConversationsResponse {
  success: boolean;
  conversations: Conversation[];
  nextCursor?: string | null;
}

export interface ConversationMessagesResponse {
  success: boolean;
  messages: Message[];
}

/** Payload of the realtime `incomingNewMessage` socket event. */
export interface IncomingNewMessagePayload {
  message: Message;
  updatedConversation?: Conversation;
}
