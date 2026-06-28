"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { NearbyUser } from "@/lib/types";

export type GeoStatus =
  | "locating"
  | "ready"
  | "denied"
  | "unsupported"
  | "error";

type Coords = { latitude: number; longitude: number };

const GEO_OPTS: PositionOptions = {
  enableHighAccuracy: true,
  timeout: 10_000,
  maximumAge: 30_000,
};

const geolocationSupported = () =>
  typeof navigator !== "undefined" && "geolocation" in navigator;

/**
 * Drives location-based friend finding:
 * - reads the browser geolocation (one-shot),
 * - publishes the caller's location so others can discover them (toggleable),
 * - queries the backend for nearby users within `radiusKm`.
 *
 * The backend stores locations in-memory with no TTL, so we (re)publish on every
 * locate and retract on unmount / when sharing is turned off.
 */
export function useNearby(radiusKm: number) {
  // Start in "locating": SSR and the first client render agree (no hydration gap),
  // and the mount effect immediately kicks off the real geolocation request.
  const [status, setStatus] = React.useState<GeoStatus>("locating");
  const [coords, setCoords] = React.useState<Coords | null>(null);
  const [sharing, setSharing] = React.useState(true);

  const onPosition = React.useCallback((pos: GeolocationPosition) => {
    setCoords({
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
    });
    setStatus("ready");
  }, []);

  const onPositionError = React.useCallback((err: GeolocationPositionError) => {
    setStatus(err.code === err.PERMISSION_DENIED ? "denied" : "error");
  }, []);

  // Retry handler for the UI buttons (event-driven — setState here is fine).
  const locate = React.useCallback(() => {
    if (!geolocationSupported()) {
      setStatus("unsupported");
      return;
    }
    setStatus("locating");
    navigator.geolocation.getCurrentPosition(onPosition, onPositionError, GEO_OPTS);
  }, [onPosition, onPositionError]);

  // Locate once on mount by synchronizing with the Geolocation API (an external
  // system). State transitions happen inside the async callbacks above.
  React.useEffect(() => {
    if (geolocationSupported()) {
      navigator.geolocation.getCurrentPosition(onPosition, onPositionError, GEO_OPTS);
      return;
    }
    // Defer so we never setState synchronously inside the effect body.
    const id = window.setTimeout(() => setStatus("unsupported"), 0);
    return () => window.clearTimeout(id);
  }, [onPosition, onPositionError]);

  // Publish (or retract) our own location whenever it changes or sharing toggles.
  React.useEffect(() => {
    if (status !== "ready" || !coords) return;
    if (sharing) {
      api.updateLocation(coords).catch(() => {});
    } else {
      api.removeLocation().catch(() => {});
    }
  }, [status, coords, sharing]);

  // Stop sharing when the user leaves the screen.
  React.useEffect(() => {
    return () => {
      api.removeLocation().catch(() => {});
    };
  }, []);

  const nearby = useQuery<NearbyUser[]>({
    queryKey: ["nearby", coords?.latitude, coords?.longitude, radiusKm],
    enabled: status === "ready" && !!coords,
    queryFn: async ({ signal }) => {
      const res = await api.findNearby(
        {
          latitude: coords!.latitude,
          longitude: coords!.longitude,
          maxDistance: radiusKm,
        },
        signal,
      );
      return res.users ?? [];
    },
    staleTime: 15_000,
  });

  const refresh = React.useCallback(() => {
    locate();
    void nearby.refetch();
  }, [locate, nearby]);

  return { status, coords, sharing, setSharing, locate, refresh, nearby };
}
