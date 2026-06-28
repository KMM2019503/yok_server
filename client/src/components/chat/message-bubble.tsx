"use client";

import { Check, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatMessageTime, isReadByPeer } from "@/lib/chat-utils";
import type { Message } from "@/lib/types";

interface Props {
  message: Message;
  mine: boolean;
  /** Tighten spacing when grouped with the previous bubble from same sender. */
  grouped: boolean;
}

export function MessageBubble({ message, mine, grouped }: Props) {
  const pending = message.id.startsWith("temp-");
  const read = mine && isReadByPeer(message, message.senderId ?? "");

  return (
    <div
      className={cn(
        "flex w-full animate-in-bubble",
        mine ? "justify-end" : "justify-start",
        grouped ? "mt-0.5" : "mt-3",
      )}
    >
      <div
        className={cn(
          "group relative max-w-[78%] rounded-2xl px-3.5 py-2 text-sm shadow-sm sm:max-w-[65%]",
          mine
            ? "rounded-br-md bg-bubble-out text-bubble-out-foreground"
            : "rounded-bl-md bg-bubble-in text-bubble-in-foreground",
          pending && "opacity-70",
        )}
      >
        <p className="whitespace-pre-wrap break-words">{message.content}</p>
        <span
          className={cn(
            "mt-0.5 flex items-center justify-end gap-1 text-[10px] leading-none",
            mine ? "text-bubble-out-foreground/70" : "text-muted-foreground",
          )}
        >
          {formatMessageTime(message.createdAt)}
          {mine &&
            (pending ? (
              <Check className="size-3 opacity-60" aria-label="Sending" />
            ) : read ? (
              <CheckCheck className="size-3.5" aria-label="Read" />
            ) : (
              <Check className="size-3.5" aria-label="Sent" />
            ))}
        </span>
      </div>
    </div>
  );
}
