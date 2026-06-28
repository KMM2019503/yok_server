"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Conversation } from "@/lib/types";

export const conversationsKey = ["conversations"] as const;

export function useConversations() {
  return useQuery<Conversation[]>({
    queryKey: conversationsKey,
    queryFn: async () => {
      const res = await api.getConversations();
      return res.conversations ?? [];
    },
  });
}
