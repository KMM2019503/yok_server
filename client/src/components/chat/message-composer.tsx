"use client";

import * as React from "react";
import { SendHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSendMessage } from "@/hooks/use-send-message";

interface Props {
  conversationId: string;
  receiverId: string;
  currentUserId: string;
}

export function MessageComposer({ conversationId, receiverId, currentUserId }: Props) {
  const [value, setValue] = React.useState("");
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const send = useSendMessage({ conversationId, receiverId, currentUserId });

  function autosize() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }

  function submit() {
    const content = value.trim();
    if (!content || send.isPending) return;
    send.mutate(content);
    setValue("");
    requestAnimationFrame(() => {
      if (textareaRef.current) textareaRef.current.style.height = "auto";
    });
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  return (
    <div className="border-t border-border bg-background px-4 py-3 sm:px-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="mx-auto flex max-w-3xl items-end gap-2"
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            autosize();
          }}
          onKeyDown={onKeyDown}
          rows={1}
          placeholder="Type a message…"
          aria-label="Message"
          className="scrollbar-thin max-h-40 min-h-10 flex-1 resize-none rounded-2xl border border-input bg-card px-4 py-2.5 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <Button
          type="submit"
          size="icon"
          className="size-10 rounded-full"
          aria-label="Send message"
          disabled={!value.trim() || send.isPending}
        >
          <SendHorizontal className="size-4" />
        </Button>
      </form>
    </div>
  );
}
