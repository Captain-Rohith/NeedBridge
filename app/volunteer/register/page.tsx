import { Suspense } from "react";
import { VolunteerForm } from "@/components/volunteer-form";

export default function VolunteerRegisterPage() {
  const vapidKey =
    process.env.NEXT_PUBLIC_FCM_VAPID_KEY ?? process.env.FCM_VAPID_KEY ?? "";

  return (
    <main className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">Volunteer Profile</p>
        <h1 className="mt-2 font-display text-4xl font-semibold">Register or update how you can help</h1>
      </div>
      <Suspense fallback={<div className="panel p-6 text-sm text-slate-500">Loading registration form...</div>}>
        <VolunteerForm vapidKey={vapidKey} />
      </Suspense>
    </main>
  );
}
