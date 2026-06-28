"use client";

import * as React from "react";
import { useParams } from "next/navigation";
import { Search, MessageSquarePlus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { ConversationItem } from "./conversation-item";
import { ComposeButton } from "./compose-button";
import { useConversations } from "@/hooks/use-conversations";
import { useAuth } from "@/providers/auth-provider";
import { getPeer } from "@/lib/chat-utils";

export function ConversationList() {
  const { user, onlineUserIds } = useAuth();
  const { data: conversations, isLoading, isError, refetch } = useConversations();
  const params = useParams<{ conversationId?: string }>();
  const activeId = params?.conversationId;
  const [query, setQuery] = React.useState("");

  const filtered = React.useMemo(() => {
    if (!conversations) return [];
    const q = query.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((c) => {
      const peer = user ? getPeer(c, user.id) : null;
      return peer?.userName?.toLowerCase().includes(q);
    });
  }, [conversations, query, user]);

  return (
    <div className="flex h-full flex-col">
      <div className="px-3 pb-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search conversations"
            className="pl-9"
            aria-label="Search conversations"
          />
        </div>
      </div>

      <div className="scrollbar-thin flex-1 space-y-0.5 overflow-y-auto px-2 pb-3">
        {isLoading && <ListSkeleton />}

        {isError && (
          <div className="px-3 py-8 text-center text-sm text-muted-foreground">
            <p>Couldn&apos;t load conversations.</p>
            <button
              onClick={() => refetch()}
              className="mt-2 font-medium text-primary hover:underline"
            >
              Retry
            </button>
          </div>
        )}

        {!isLoading && !isError && filtered.length === 0 && (
          <div className="flex flex-col items-center gap-3 px-4 py-12 text-center">
            <MessageSquarePlus className="size-8 text-muted-foreground/60" />
            <p className="text-sm text-muted-foreground">
              {query ? "No matches." : "No conversations yet."}
            </p>
            {!query && <ComposeButton label="Start a chat" />}
          </div>
        )}

        {!isError &&
          user &&
          filtered.map((c) => {
            const peer = getPeer(c, user.id);
            return (
              <ConversationItem
                key={c.id}
                conversation={c}
                currentUserId={user.id}
                online={peer ? onlineUserIds.has(peer.id) : false}
                active={c.id === activeId}
              />
            );
          })}
      </div>
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="space-y-1 px-1">
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 px-2 py-2.5">
          <Skeleton className="size-11 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-1/3" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
