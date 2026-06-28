"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2 } from "lucide-react";
import { Dialog } from "@/components/ui/dialog";
import { Avatar } from "@/components/ui/avatar";
import { useUserSearch } from "@/hooks/use-user-search";
import { useConversations } from "@/hooks/use-conversations";
import { useAuth } from "@/providers/auth-provider";
import type { UserSearchResult } from "@/lib/types";

export function NewMessageDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const { user } = useAuth();
  const { data: conversations } = useConversations();
  const [term, setTerm] = React.useState("");
  const { data: results, isFetching, query } = useUserSearch(term);

  function startWith(peer: UserSearchResult) {
    // Reuse an existing conversation with this user if we have one.
    const existing = conversations?.find((c) =>
      c.members.some((m) => m.userId === peer.id),
    );
    onClose();
    if (existing) {
      router.push(`/chat/${existing.id}`);
      return;
    }
    const params = new URLSearchParams({ to: peer.id, name: peer.userName });
    if (peer.profilePictureUrl) params.set("avatar", peer.profilePictureUrl);
    router.push(`/chat/new?${params.toString()}`);
  }

  const showEmpty =
    query.length >= 1 && !isFetching && (results?.length ?? 0) === 0;

  return (
    <Dialog open={open} onClose={onClose} label="New message">
      <div className="border-b border-border px-5 py-4">
        <h2 className="text-base font-semibold">New message</h2>
        <p className="text-sm text-muted-foreground">
          Search people by name, email, or ID.
        </p>
      </div>

      <div className="px-4 pt-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          {isFetching && (
            <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-muted-foreground" />
          )}
          <input
            autoFocus
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Search people…"
            aria-label="Search people"
            className="h-11 w-full rounded-xl border border-input bg-background pl-9 pr-9 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      </div>

      <div className="scrollbar-thin max-h-80 overflow-y-auto p-2">
        {query.length < 1 && (
          <p className="px-3 py-10 text-center text-sm text-muted-foreground">
            Start typing to find people.
          </p>
        )}

        {showEmpty && (
          <p className="px-3 py-10 text-center text-sm text-muted-foreground">
            No people found for “{query}”.
          </p>
        )}

        {results?.map((p) => {
          const isSelf = p.id === user?.id;
          return (
            <button
              key={p.id}
              disabled={isSelf}
              onClick={() => startWith(p)}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none disabled:opacity-50"
            >
              <Avatar src={p.profilePictureUrl} name={p.userName} className="size-10" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">
                  {p.userName}
                  {isSelf && (
                    <span className="ml-2 text-xs text-muted-foreground">(you)</span>
                  )}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {p.userUniqueID ? `${p.userUniqueID} · ` : ""}
                  {p.email}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </Dialog>
  );
}
