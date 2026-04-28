import { Suspense } from "react";
import { AuthForm } from "@/components/auth-form";

export default function AuthPage() {
  return (
    <main className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">Volunteer Access</p>
        <h1 className="mt-2 font-display text-4xl font-semibold">Sign in to track your impact</h1>
      </div>
      <Suspense fallback={<div className="panel p-6 text-sm text-slate-500">Loading sign-in...</div>}>
        <AuthForm />
      </Suspense>
    </main>
  );
}
