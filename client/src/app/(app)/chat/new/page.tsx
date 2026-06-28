"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { SendHorizontal } from "lucide-react";
import { ChatHeader } from "@/components/chat/chat-header";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { conversationsKey } from "@/hooks/use-conversations";
import { useAuth } from "@/providers/auth-provider";
import type { UserSummary } from "@/lib/types";

export default function NewConversationPage() {
  const router = useRouter();
  const params = useSearchParams();
  const qc = useQueryClient();
  const { onlineUserIds } = useAuth();

  const receiverId = params.get("to");
  const peer: UserSummary | null = receiverId
    ? {
        id: receiverId,
        userName: params.get("name") ?? "New chat",
        profilePictureUrl: params.get("avatar"),
      }
    : null;

  const [value, setValue] = React.useState("");

  const start = useMutation({
    mutationFn: async (content: string) => {
      const res = await api.sendDirectMessage({ content, receiverId: receiverId! });
      return res.conversation?.id ?? null;
    },
    onSuccess: async (conversationId) => {
      await qc.invalidateQueries({ queryKey: conversationsKey });
      if (conversationId) router.replace(`/chat/${conversationId}`);
      else router.replace("/chat");
    },
  });

  // No recipient → nothing to draft.
  React.useEffect(() => {
    if (!receiverId) router.replace("/chat");
  }, [receiverId, router]);

  if (!peer) return null;

  function submit() {
    const content = value.trim();
    if (!content || start.isPending) return;
    start.mutate(content);
  }

  return (
    <div className="flex h-dvh flex-col">
      <ChatHeader peer={peer} online={onlineUserIds.has(peer.id)} />

      <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center text-sm text-muted-foreground">
        <p className="font-medium text-foreground">
          Start a conversation with {peer.userName}
        </p>
        <p>Send a message below — it&apos;ll create the chat.</p>
      </div>

      <div className="border-t border-border bg-background px-4 py-3 sm:px-6">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="mx-auto flex max-w-3xl items-end gap-2"
        >
          <textarea
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            rows={1}
            placeholder={`Message ${peer.userName}…`}
            aria-label="Message"
            className="scrollbar-thin max-h-40 min-h-10 flex-1 resize-none rounded-2xl border border-input bg-card px-4 py-2.5 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <Button
            type="submit"
            size="icon"
            className="size-10 rounded-full"
            aria-label="Send message"
            disabled={!value.trim() || start.isPending}
          >
            <SendHorizontal className="size-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
