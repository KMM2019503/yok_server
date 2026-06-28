"use client";

import { ConversationList } from "@/components/chat/conversation-list";
import { EmptyState } from "@/components/chat/empty-state";
import { ComposeIconButton } from "@/components/chat/compose-button";
import { NearbyNavButton } from "@/components/nearby/nearby-nav-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { BrandWordmark } from "@/components/brand";

export default function ChatIndexPage() {
  return (
    <>
      {/* Desktop: sidebar already shows the list, so show a prompt here. */}
      <EmptyState className="hidden md:flex" />

      {/* Mobile: this route is the conversation list. */}
      <div className="flex h-dvh flex-col md:hidden">
        <header className="flex items-center justify-between px-4 py-3.5">
          <BrandWordmark />
          <div className="flex items-center gap-0.5">
            <NearbyNavButton />
            <ComposeIconButton />
            <ThemeToggle />
          </div>
        </header>
        <h1 className="px-5 pb-2 text-sm font-semibold text-muted-foreground">
          Messages
        </h1>
        <div className="min-h-0 flex-1">
          <ConversationList />
        </div>
      </div>
    </>
  );
}
