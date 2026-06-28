"use client";

import * as React from "react";
import { cn, initials } from "@/lib/utils";

interface AvatarProps {
  src?: string | null;
  name?: string | null;
  className?: string;
  /** Show a green presence dot when true; gray when false; hidden when undefined. */
  online?: boolean;
}

const sizeRing = "ring-2 ring-background";

export function Avatar({ src, name, className, online }: AvatarProps) {
  const [errored, setErrored] = React.useState(false);
  const showImage = src && !errored;

  return (
    <span className={cn("relative inline-flex shrink-0", className)}>
      <span
        className={cn(
          "flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-accent text-accent-foreground font-medium select-none",
        )}
      >
        {showImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={name ?? "avatar"}
            className="h-full w-full object-cover"
            onError={() => setErrored(true)}
          />
        ) : (
          <span className="text-[0.8em]">{initials(name)}</span>
        )}
      </span>
      {online !== undefined && (
        <span
          aria-label={online ? "Online" : "Offline"}
          className={cn(
            "absolute bottom-0 right-0 block h-[28%] min-h-2 min-w-2 w-[28%] rounded-full",
            sizeRing,
            online ? "bg-online" : "bg-muted-foreground/40",
          )}
        />
      )}
    </span>
  );
}
