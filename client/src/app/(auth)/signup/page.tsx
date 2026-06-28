"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { Gender } from "@/lib/types";

const GENDERS: { value: Gender; label: string }[] = [
  { value: "M", label: "Male" },
  { value: "F", label: "Female" },
  { value: "T", label: "Other" },
];

export default function SignupPage() {
  const { signup } = useAuth();
  const router = useRouter();
  const [form, setForm] = React.useState({
    userName: "",
    email: "",
    passwords: "",
    gender: undefined as Gender | undefined,
  });
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signup({
        userName: form.userName.trim(),
        email: form.email.trim(),
        passwords: form.passwords,
        gender: form.gender,
      });
      router.replace("/chat");
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Something went wrong. Try again.",
      );
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="mb-8 space-y-1.5">
        <h2 className="text-2xl font-semibold tracking-tight">Create your account</h2>
        <p className="text-sm text-muted-foreground">
          Join Yok and start messaging in seconds.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <div className="space-y-2">
          <label htmlFor="userName" className="text-sm font-medium">
            Display name
          </label>
          <Input
            id="userName"
            autoComplete="name"
            placeholder="Jane Doe"
            value={form.userName}
            onChange={(e) => update("userName", e.target.value)}
            required
            autoFocus
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium">
            Password
          </label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            placeholder="Create a password"
            value={form.passwords}
            onChange={(e) => update("passwords", e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <span className="text-sm font-medium">Gender (optional)</span>
          <div className="grid grid-cols-3 gap-2">
            {GENDERS.map((g) => {
              const active = form.gender === g.value;
              return (
                <button
                  type="button"
                  key={g.value}
                  aria-pressed={active}
                  onClick={() => update("gender", active ? undefined : g.value)}
                  className={cn(
                    "h-10 rounded-lg border text-sm font-medium transition-colors cursor-pointer",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    active
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border hover:bg-accent",
                  )}
                >
                  {g.label}
                </button>
              );
            })}
          </div>
        </div>

        {error && (
          <p
            role="alert"
            className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {error}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting && <Spinner className="size-4 text-current" />}
          {submitting ? "Creating account…" : "Create account"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
