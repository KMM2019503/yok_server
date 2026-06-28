"use client";

import { useRouter } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useConversations } from "@/hooks/use-conversations";
import type { NearbyUser } from "@/lib/types";

export function NearbyItem({ user }: { user: NearbyUser }) {
  const router = useRouter();
  const { data: conversations } = useConversations();

  function message() {
    // Reuse an existing conversation with this user if we have one.
    const existing = conversations?.find((c) =>
      c.members.some((m) => m.userId === user.id),
    );
    if (existing) {
      router.push(`/chat/${existing.id}`);
      return;
    }
    const params = new URLSearchParams({ to: user.id, name: user.userName });
    if (user.profilePictureUrl) params.set("avatar", user.profilePictureUrl);
    router.push(`/chat/new?${params.toString()}`);
  }

  return (
    <li className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-accent/60">
      <Avatar
        src={user.profilePictureUrl}
        name={user.userName}
        className="size-11"
      />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{user.userName}</p>
        <p className="truncate text-xs text-muted-foreground">
          {user.userUniqueID ? `${user.userUniqueID} · ` : ""}
          {user.email}
        </p>
      </div>
      <Button variant="outline" size="sm" onClick={message}>
        <MessageCircle className="size-4" />
        Message
      </Button>
    </li>
  );
}
