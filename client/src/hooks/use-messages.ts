"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Message } from "@/lib/types";

export const messagesKey = (conversationId: string) =>
  ["messages", conversationId] as const;

/**
 * Latest messages for a conversation, stored ascending (oldest → newest)
 * so the thread renders top-to-bottom and realtime appends go to the end.
 */
export function useMessages(conversationId: string | null) {
  return useQuery<Message[]>({
    queryKey: messagesKey(conversationId ?? ""),
    enabled: !!conversationId,
    queryFn: async () => {
      const res = await api.getConversationMessages(conversationId!, { take: 40 });
      // Backend returns newest-first; reverse to chronological order.
      return [...(res.messages ?? [])].reverse();
    },
  });
}
