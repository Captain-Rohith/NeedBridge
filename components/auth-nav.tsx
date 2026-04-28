"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth-provider";

export function AuthNav() {
  const { user, loading, signOut } = useAuth();

  if (loading) {
    return <span className="rounded-full bg-white/10 px-4 py-2 text-sm">Loading...</span>;
  }

  if (!user) {
    return (
      <Link href="/auth" className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-ink">
        Sign in
      </Link>
    );
  }

  return (
    <div className="flex flex-wrap gap-3 text-sm">
      <Link href="/volunteer/history" className="rounded-full bg-white/10 px-4 py-2 hover:bg-white/20">
        My history
      </Link>
      <button
        type="button"
        className="rounded-full bg-white px-4 py-2 font-semibold text-ink"
        onClick={() => void signOut()}
      >
        Sign out
      </button>
    </div>
  );
}
