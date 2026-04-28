"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/auth-provider";

export function AuthForm() {
  const { signIn, signUp } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const next = searchParams.get("next") ?? "/volunteer/register";

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "");
    const email = String(formData.get("email") ?? "");
    const password = String(formData.get("password") ?? "");
    setLoading(true);
    setError(null);

    try {
      if (mode === "signup") {
        await signUp(name, email, password);
      } else {
        await signIn(email, password);
      }
      router.push(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="panel mx-auto max-w-xl p-6">
      <div className="mb-6 flex gap-3">
        <button
          type="button"
          className={mode === "signin" ? "button-primary" : "button-secondary"}
          onClick={() => setMode("signin")}
        >
          Sign in
        </button>
        <button
          type="button"
          className={mode === "signup" ? "button-primary" : "button-secondary"}
          onClick={() => setMode("signup")}
        >
          Create account
        </button>
      </div>
      <form className="space-y-4" onSubmit={onSubmit}>
        {mode === "signup" ? (
          <input className="input" name="name" placeholder="Full name" required />
        ) : null}
        <input className="input" name="email" type="email" placeholder="Email" required />
        <input
          className="input"
          name="password"
          type="password"
          placeholder="Password"
          minLength={6}
          required
        />
        <button className="button-primary" disabled={loading}>
          {loading ? "Please wait..." : mode === "signup" ? "Create account" : "Sign in"}
        </button>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </form>
    </div>
  );
}
