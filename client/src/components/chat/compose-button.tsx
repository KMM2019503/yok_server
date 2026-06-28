"use client";

import * as React from "react";
import { SquarePen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NewMessageDialog } from "./new-message-dialog";

/** Icon-only trigger (sidebar header). */
export function ComposeIconButton() {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        aria-label="New message"
        title="New message"
        onClick={() => setOpen(true)}
      >
        <SquarePen className="size-4.5" />
      </Button>
      {open && <NewMessageDialog open onClose={() => setOpen(false)} />}
    </>
  );
}

/** Full-width labelled trigger (empty states). */
export function ComposeButton({ label = "New message" }: { label?: string }) {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <SquarePen className="size-4" />
        {label}
      </Button>
      {open && <NewMessageDialog open onClose={() => setOpen(false)} />}
    </>
  );
}
