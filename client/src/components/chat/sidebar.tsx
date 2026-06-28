"use client";

import { LogOut } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { BrandWordmark } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";
import { ComposeIconButton } from "./compose-button";
import { ConversationList } from "./conversation-list";
import { NearbyNavButton } from "@/components/nearby/nearby-nav-button";
import { useAuth } from "@/providers/auth-provider";
import { cn } from "@/lib/utils";

export function Sidebar({ className }: { className?: string }) {
  const { user, logout } = useAuth();

  return (
    <aside
      className={cn(
        "flex h-dvh w-full flex-col border-r border-sidebar-border bg-sidebar",
        className,
      )}
    >
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

      <footer className="flex items-center gap-3 border-t border-sidebar-border px-3 py-3">
        <Avatar
          src={user?.profilePictureUrl}
          name={user?.userName}
          className="size-9"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{user?.userName}</p>
          <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Sign out"
          title="Sign out"
          onClick={() => logout()}
        >
          <LogOut className="size-4" />
        </Button>
      </footer>
    </aside>
  );
}
