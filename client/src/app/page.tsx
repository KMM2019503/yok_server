"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { Spinner } from "@/components/ui/spinner";

export default function RootPage() {
  const { status } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (status === "authenticated") router.replace("/chat");
    else if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  return (
    <div className="flex h-dvh items-center justify-center">
      <Spinner className="size-6" />
    </div>
  );
}
