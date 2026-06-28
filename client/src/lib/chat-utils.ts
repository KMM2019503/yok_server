import { isToday, isYesterday, format } from "date-fns";
import type { Conversation, Message, UserSummary } from "./types";

/** Sender id, normalizing the two backend shapes (senderId vs sender.id). */
export function getSenderId(message: Message): string {
  return message.senderId ?? message.sender?.id ?? "";
}

/** The other participant in a 1:1 conversation (relative to the current user). */
export function getPeer(
  conversation: Conversation,
  currentUserId: string,
): UserSummary | null {
  const other =
    conversation.members.find((m) => m.userId !== currentUserId) ??
    conversation.members[0];
  return other?.user ?? null;
}

/** Compact timestamp for conversation rows. */
export function formatListTime(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isToday(d)) return format(d, "h:mm a");
  if (isYesterday(d)) return "Yesterday";
  return format(d, "MMM d");
}

/** Time shown next to a message bubble. */
export function formatMessageTime(iso: string): string {
  return format(new Date(iso), "h:mm a");
}

/** Day separator label inside a thread. */
export function formatDayDivider(iso: string): string {
  const d = new Date(iso);
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  return format(d, "EEEE, MMM d");
}

/** YYYY-MM-DD key for grouping messages by calendar day. */
export function dayKey(iso: string): string {
  return format(new Date(iso), "yyyy-MM-dd");
}

/** Whether the message has been read by anyone other than the sender. */
export function isReadByPeer(message: Message, senderId: string): boolean {
  if (message.status?.status === "READ") return true;
  return (message.status?.seenUserIds ?? []).some((id) => id !== senderId);
}
