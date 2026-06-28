"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowLeft,
  MapPin,
  MapPinOff,
  RefreshCw,
  Radar,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ThemeToggle } from "@/components/theme-toggle";
import { useNearby } from "@/hooks/use-nearby";
import { NearbyItem } from "./nearby-item";
import { cn } from "@/lib/utils";

const RADII = [1, 5, 10, 25] as const;

export function NearbyList() {
  const [radius, setRadius] = React.useState<number>(5);
  const { status, sharing, setSharing, locate, refresh, nearby } =
    useNearby(radius);

  return (
    <div className="flex h-dvh flex-col">
      <header className="flex items-center justify-between px-4 py-3.5">
        <div className="flex items-center gap-1">
          <Button
            asChild
            variant="ghost"
            size="icon"
            aria-label="Back to messages"
            title="Back to messages"
            className="md:hidden"
          >
            <Link href="/chat">
              <ArrowLeft className="size-4.5" />
            </Link>
          </Button>
          <h1 className="text-base font-semibold">Nearby</h1>
        </div>
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Refresh"
            title="Refresh"
            disabled={status === "locating" || nearby.isFetching}
            onClick={refresh}
          >
            <RefreshCw
              className={cn(
                "size-4.5",
                (status === "locating" || nearby.isFetching) && "animate-spin",
              )}
            />
          </Button>
          <ThemeToggle />
        </div>
      </header>

      <div className="px-5 pb-3">
        <p className="text-sm text-muted-foreground">
          People sharing their location near you.
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <div
            role="group"
            aria-label="Search radius"
            className="inline-flex rounded-lg border border-border p-0.5"
          >
            {RADII.map((r) => (
              <button
                key={r}
                type="button"
                aria-pressed={radius === r}
                onClick={() => setRadius(r)}
                className={cn(
                  "h-8 cursor-pointer rounded-md px-3 text-sm font-medium transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  radius === r
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {r} km
              </button>
            ))}
          </div>

          <Button
            variant={sharing ? "secondary" : "outline"}
            size="sm"
            aria-pressed={sharing}
            onClick={() => setSharing((s) => !s)}
            title={
              sharing
                ? "You're discoverable to others nearby"
                : "You're hidden from others"
            }
          >
            {sharing ? (
              <MapPin className="size-4" />
            ) : (
              <MapPinOff className="size-4" />
            )}
            {sharing ? "Sharing on" : "Sharing off"}
          </Button>
        </div>
      </div>

      <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto px-3 pb-4">
        <NearbyBody status={status} radius={radius} nearby={nearby} onRetry={locate} />
      </div>
    </div>
  );
}

function NearbyBody({
  status,
  radius,
  nearby,
  onRetry,
}: {
  status: ReturnType<typeof useNearby>["status"];
  radius: number;
  nearby: ReturnType<typeof useNearby>["nearby"];
  onRetry: () => void;
}) {
  if (status === "unsupported") {
    return (
      <Centered
        icon={<MapPinOff className="size-6" />}
        title="Location not supported"
        body="This browser can't share your location, so nearby people can't be found."
      />
    );
  }

  if (status === "denied") {
    return (
      <Centered
        icon={<MapPinOff className="size-6" />}
        title="Location access blocked"
        body="Allow location access in your browser settings, then try again."
        action={
          <Button variant="outline" size="sm" onClick={onRetry}>
            Try again
          </Button>
        }
      />
    );
  }

  if (status === "error") {
    return (
      <Centered
        icon={<MapPinOff className="size-6" />}
        title="Couldn't get your location"
        body="Something went wrong while locating you."
        action={
          <Button variant="outline" size="sm" onClick={onRetry}>
            Try again
          </Button>
        }
      />
    );
  }

  if (status === "locating") {
    return <Centered icon={<Spinner className="size-6" />} title="Finding your location…" />;
  }

  // status === "ready"
  if (nearby.isPending) {
    return <Centered icon={<Spinner className="size-6" />} title="Looking for people nearby…" />;
  }

  if (nearby.isError) {
    return (
      <Centered
        icon={<MapPinOff className="size-6" />}
        title="Couldn't load nearby people"
        body={nearby.error instanceof Error ? nearby.error.message : undefined}
        action={
          <Button variant="outline" size="sm" onClick={() => void nearby.refetch()}>
            Try again
          </Button>
        }
      />
    );
  }

  const users = nearby.data ?? [];
  if (users.length === 0) {
    return (
      <Centered
        icon={<Radar className="size-6" />}
        title="No one nearby"
        body={`No one is sharing their location within ${radius} km right now.`}
      />
    );
  }

  return (
    <>
      <p className="flex items-center gap-1.5 px-3 pb-1 pt-1 text-xs font-medium text-muted-foreground">
        <Users className="size-3.5" />
        {users.length} {users.length === 1 ? "person" : "people"} within {radius} km
      </p>
      <ul>
        {users.map((u) => (
          <NearbyItem key={u.id} user={u} />
        ))}
      </ul>
    </>
  );
}

function Centered({
  icon,
  title,
  body,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  body?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
      <div className="text-muted-foreground">{icon}</div>
      <div className="space-y-1">
        <p className="font-medium">{title}</p>
        {body && (
          <p className="mx-auto max-w-xs text-sm text-muted-foreground">{body}</p>
        )}
      </div>
      {action}
    </div>
  );
}
