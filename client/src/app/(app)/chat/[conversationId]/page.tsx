"use client";

import { useParams } from "next/navigation";
import { ChatHeader } from "@/components/chat/chat-header";
import { MessageList } from "@/components/chat/message-list";
import { MessageComposer } from "@/components/chat/message-composer";
import { Spinner } from "@/components/ui/spinner";
import { useConversations } from "@/hooks/use-conversations";
import { useAuth } from "@/providers/auth-provider";
import { getPeer } from "@/lib/chat-utils";

export default function ConversationPage() {
  const params = useParams<{ conversationId: string }>();
  const conversationId = params.conversationId;
  const { user, onlineUserIds } = useAuth();
  const { data: conversations, isLoading } = useConversations();

  const conversation = conversations?.find((c) => c.id === conversationId);
  const peer = user && conversation ? getPeer(conversation, user.id) : null;

  if (!user) return null;

  if (isLoading && !conversation) {
    return (
      <div className="flex h-dvh items-center justify-center">
        <Spinner className="size-6" />
      </div>
    );
  }

  if (!conversation || !peer) {
    return (
      <div className="flex h-dvh flex-col items-center justify-center gap-2 p-8 text-center">
        <p className="font-medium">Conversation unavailable</p>
        <p className="text-sm text-muted-foreground">
          It may have been removed or isn&apos;t loaded yet.
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-dvh flex-col">
      <ChatHeader peer={peer} online={onlineUserIds.has(peer.id)} />
      <MessageList conversationId={conversationId} />
      <MessageComposer
        conversationId={conversationId}
        receiverId={peer.id}
        currentUserId={user.id}
      />
    </div>
  );
}
