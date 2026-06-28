"use client";

import Link from "next/link";
import { Radar } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Icon-only link to the location-based "Nearby" screen (headers). */
export function NearbyNavButton() {
  return (
    <Button
      asChild
      variant="ghost"
      size="icon"
      aria-label="Find people nearby"
      title="Nearby"
    >
      <Link href="/nearby">
        <Radar className="size-4.5" />
      </Link>
    </Button>
  );
}
