"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { useRealtime } from "@/hooks/use-realtime";
import { Sidebar } from "@/components/chat/sidebar";
import { Spinner } from "@/components/ui/spinner";

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const { status, user } = useAuth();
  const router = useRouter();

  // Client-side guard: bounce unauthenticated users to login.
  React.useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  // Single subscription point for realtime cache updates.
  useRealtime(user?.id);

  if (status !== "authenticated") {
    return (
      <div className="flex h-dvh items-center justify-center">
        <Spinner className="size-6" />
      </div>
    );
  }

  return (
    <div className="flex h-dvh overflow-hidden">
      <Sidebar className="hidden w-80 shrink-0 md:flex lg:w-96" />
      <main className="flex min-w-0 flex-1 flex-col">{children}</main>
    </div>
  );
}
