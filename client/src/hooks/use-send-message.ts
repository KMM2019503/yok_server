"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Conversation, Message } from "@/lib/types";
import { messagesKey } from "./use-messages";
import { conversationsKey } from "./use-conversations";

interface SendArgs {
  conversationId: string;
  receiverId: string;
  currentUserId: string;
}

/** Send a DM with optimistic append + conversation reorder. */
export function useSendMessage({ conversationId, receiverId, currentUserId }: SendArgs) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (content: string) => {
      const res = await api.sendDirectMessage({
        content,
        receiverId,
        conversationId,
      });
      return res.message as Message | undefined;
    },

    onMutate: async (content: string) => {
      const key = messagesKey(conversationId);
      await qc.cancelQueries({ queryKey: key });

      const tempId = `temp-${crypto.randomUUID()}`;
      const optimistic: Message = {
        id: tempId,
        content,
        senderId: currentUserId,
        status: { status: "SENT", seenUserIds: [] },
        conversationId,
        createdAt: new Date().toISOString(),
      };

      const prevMessages = qc.getQueryData<Message[]>(key);
      qc.setQueryData<Message[]>(key, (old) => [...(old ?? []), optimistic]);

      // Bump the conversation to the top with a fresh preview.
      const prevConversations = qc.getQueryData<Conversation[]>(conversationsKey);
      qc.setQueryData<Conversation[]>(conversationsKey, (old) => {
        if (!old) return old;
        const idx = old.findIndex((c) => c.id === conversationId);
        if (idx === -1) return old;
        const updated: Conversation = {
          ...old[idx]!,
          lastActivity: optimistic.createdAt,
          lastMessage: {
            content,
            senderId: currentUserId,
            createdAt: optimistic.createdAt,
          },
        };
        return [updated, ...old.filter((_, i) => i !== idx)];
      });

      return { tempId, prevMessages, prevConversations };
    },

    onSuccess: (serverMessage, _content, ctx) => {
      if (!serverMessage || !ctx) return;
      qc.setQueryData<Message[]>(messagesKey(conversationId), (old) =>
        (old ?? []).map((m) => (m.id === ctx.tempId ? serverMessage : m)),
      );
    },

    onError: (_err, _content, ctx) => {
      if (!ctx) return;
      if (ctx.prevMessages)
        qc.setQueryData(messagesKey(conversationId), ctx.prevMessages);
      if (ctx.prevConversations)
        qc.setQueryData(conversationsKey, ctx.prevConversations);
    },
  });
}
