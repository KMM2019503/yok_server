"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { formatDistanceToNowStrict } from "date-fns";
import type { UserSummary } from "@/lib/types";

interface Props {
  peer: UserSummary | null;
  online: boolean;
}

export function ChatHeader({ peer, online }: Props) {
  const status = online
    ? "Active now"
    : peer?.lastActiveAt
      ? `Active ${formatDistanceToNowStrict(new Date(peer.lastActiveAt))} ago`
      : "Offline";

  return (
    <header className="flex items-center gap-3 border-b border-border bg-background/80 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <Button
        asChild
        variant="ghost"
        size="icon"
        className="md:hidden"
        aria-label="Back to conversations"
      >
        <Link href="/chat">
          <ArrowLeft className="size-5" />
        </Link>
      </Button>

      <Avatar
        src={peer?.profilePictureUrl}
        name={peer?.userName}
        online={online}
        className="size-10"
      />
      <div className="min-w-0">
        <p className="truncate font-semibold leading-tight">
          {peer?.userName ?? "Conversation"}
        </p>
        <p className="text-xs text-muted-foreground">{status}</p>
      </div>
    </header>
  );
}
