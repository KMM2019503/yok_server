"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getSocket } from "@/lib/socket";
import type { Conversation, IncomingNewMessagePayload, Message } from "@/lib/types";
import { getSenderId } from "@/lib/chat-utils";
import { messagesKey } from "./use-messages";
import { conversationsKey } from "./use-conversations";

/**
 * Subscribes to message-related socket events and folds them into the
 * TanStack Query cache. Mount once, high in the chat tree.
 */
export function useRealtime(currentUserId: string | undefined) {
  const qc = useQueryClient();

  React.useEffect(() => {
    if (!currentUserId) return;
    const socket = getSocket();

    const onIncoming = (payload: IncomingNewMessagePayload) => {
      const { message, updatedConversation } = payload;
      const convoId = message.conversationId ?? updatedConversation?.id;
      if (!convoId) return;

      // Append to the thread if we already have it cached.
      qc.setQueryData<Message[]>(messagesKey(convoId), (old) => {
        if (!old) return old;
        if (old.some((m) => m.id === message.id)) return old;
        return [...old, message];
      });

      // Update the sidebar: refresh/insert conversation and float to top.
      qc.setQueryData<Conversation[]>(conversationsKey, (old) => {
        if (!old) return old;
        const idx = old.findIndex((c) => c.id === convoId);
        const preview = {
          content: message.content,
          senderId: getSenderId(message),
          createdAt: message.createdAt,
        };
        if (idx === -1) {
          return updatedConversation ? [updatedConversation, ...old] : old;
        }
        const merged: Conversation = {
          ...old[idx]!,
          ...(updatedConversation ?? {}),
          lastMessage: preview,
          lastActivity: message.createdAt,
        };
        return [merged, ...old.filter((_, i) => i !== idx)];
      });
    };

    const onStatusUpdated = (messages: Message[]) => {
      // Group updated messages by conversation and patch their status.
      const byConvo = new Map<string, Map<string, Message>>();
      for (const m of messages) {
        const cid = m.conversationId;
        if (!cid) continue;
        if (!byConvo.has(cid)) byConvo.set(cid, new Map());
        byConvo.get(cid)!.set(m.id, m);
      }
      for (const [cid, updates] of byConvo) {
        qc.setQueryData<Message[]>(messagesKey(cid), (old) => {
          if (!old) return old;
          return old.map((m) => {
            const u = updates.get(m.id);
            return u ? { ...m, status: u.status } : m;
          });
        });
      }
    };

    socket.on("incomingNewMessage", onIncoming);
    socket.on("messagesStatusUpdated", onStatusUpdated);

    return () => {
      socket.off("incomingNewMessage", onIncoming);
      socket.off("messagesStatusUpdated", onStatusUpdated);
    };
  }, [qc, currentUserId]);
}
