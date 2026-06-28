"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { BrandWordmark } from "@/components/brand";
import { ThemeToggle } from "@/components/theme-toggle";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();

  // Already signed in? Bounce to the app.
  React.useEffect(() => {
    if (status === "authenticated") router.replace("/chat");
  }, [status, router]);

  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      {/* Brand panel */}
      <aside className="relative hidden overflow-hidden bg-primary lg:flex lg:flex-col lg:justify-between p-12 text-primary-foreground">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 size-[28rem] rounded-full bg-white/10 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -left-16 size-[24rem] rounded-full bg-black/10 blur-3xl"
        />
        <BrandWordmark className="relative text-primary-foreground" />
        <div className="relative max-w-md">
          <h1 className="text-balance text-4xl font-semibold leading-tight tracking-tight">
            Conversations that feel instant.
          </h1>
          <p className="mt-4 text-pretty text-primary-foreground/80">
            Real-time messaging with read receipts and presence — fast, private,
            and beautifully simple.
          </p>
        </div>
        <p className="relative text-sm text-primary-foreground/60">
          © {new Date().getFullYear()} Yok
        </p>
      </aside>

      {/* Form panel */}
      <main className="relative flex flex-col">
        <header className="flex items-center justify-between p-6">
          <BrandWordmark className="lg:hidden" />
          <span className="hidden lg:block" />
          <ThemeToggle />
        </header>
        <div className="flex flex-1 items-center justify-center px-6 pb-16">
          <div className="w-full max-w-sm">{children}</div>
        </div>
      </main>
    </div>
  );
}
