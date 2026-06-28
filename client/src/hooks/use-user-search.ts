"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { UserSearchResult } from "@/lib/types";

/** Debounce a fast-changing value. */
function useDebounced<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = React.useState(value);
  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export function useUserSearch(rawQuery: string) {
  const query = useDebounced(rawQuery.trim(), 300);

  const result = useQuery<UserSearchResult[]>({
    queryKey: ["user-search", query],
    enabled: query.length >= 1,
    queryFn: async ({ signal }) => {
      const res = await api.searchUsers(query, signal);
      return res.users ?? [];
    },
    staleTime: 15_000,
  });

  return { ...result, query };
}
