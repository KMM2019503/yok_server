"use client";

import * as React from "react";
import { api, ApiError } from "@/lib/api";
import { getSocket, disconnectSocket } from "@/lib/socket";
import type { User } from "@/lib/types";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthContextValue {
  user: User | null;
  status: AuthStatus;
  onlineUserIds: Set<string>;
  login: (email: string, password: string) => Promise<void>;
  signup: (input: {
    userName: string;
    email: string;
    passwords: string;
    gender?: "M" | "F" | "T";
    dob?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);
const STORAGE_KEY = "yok.user";

function readStoredUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Hydrate from the last-known user so the UI doesn't flash on reload.
  const [user, setUser] = React.useState<User | null>(() => readStoredUser());
  const [status, setStatus] = React.useState<AuthStatus>("loading");
  const [onlineUserIds, setOnlineUserIds] = React.useState<Set<string>>(new Set());

  const persistUser = React.useCallback((next: User | null) => {
    setUser(next);
    if (typeof window === "undefined") return;
    if (next) localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    else localStorage.removeItem(STORAGE_KEY);
  }, []);

  /** Connect the shared socket and wire presence + user refresh. */
  const connectSocket = React.useCallback(
    (userId: string) => {
      const socket = getSocket();

      socket.off("connect");
      socket.off("pullOnlineUsers");
      socket.off("userData");

      socket.on("connect", () => {
        socket.emit("reconnectUser", { userId });
      });
      socket.on("pullOnlineUsers", (ids) => setOnlineUserIds(new Set(ids)));
      socket.on("userData", (fresh) => {
        if (fresh) persistUser(fresh);
      });

      if (!socket.connected) socket.connect();
    },
    [persistUser],
  );

  // Validate the session on first load using the httpOnly cookie.
  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        await api.checkAuth();
        if (cancelled) return;
        const current = readStoredUser();
        setStatus("authenticated");
        if (current?.id) connectSocket(current.id);
      } catch (err) {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 401) {
          persistUser(null);
        }
        setStatus("unauthenticated");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [connectSocket, persistUser]);

  const login = React.useCallback(
    async (email: string, password: string) => {
      const res = await api.login({ email, password });
      persistUser(res.user);
      setStatus("authenticated");
      connectSocket(res.user.id);
    },
    [connectSocket, persistUser],
  );

  const signup = React.useCallback(
    async (input: Parameters<AuthContextValue["signup"]>[0]) => {
      const res = await api.signup(input);
      persistUser(res.user);
      setStatus("authenticated");
      connectSocket(res.user.id);
    },
    [connectSocket, persistUser],
  );

  const logout = React.useCallback(async () => {
    try {
      await api.logout();
    } catch {
      // ignore — clear locally regardless
    }
    disconnectSocket();
    setOnlineUserIds(new Set());
    persistUser(null);
    setStatus("unauthenticated");
  }, [persistUser]);

  const value = React.useMemo<AuthContextValue>(
    () => ({
      user,
      status,
      onlineUserIds,
      login,
      signup,
      logout,
    }),
    [user, status, onlineUserIds, login, signup, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
