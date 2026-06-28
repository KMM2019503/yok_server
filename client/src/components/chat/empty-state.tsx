import { MessagesSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { ComposeButton } from "./compose-button";

export function EmptyState({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center",
        className,
      )}
    >
      <div className="flex size-16 items-center justify-center rounded-2xl bg-accent text-primary">
        <MessagesSquare className="size-8" />
      </div>
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">Your messages</h2>
        <p className="max-w-xs text-sm text-muted-foreground">
          Select a conversation from the list, or start a new one.
        </p>
      </div>
      <ComposeButton />
    </div>
  );
}
