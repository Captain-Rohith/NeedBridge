import { VolunteerHistory } from "@/components/volunteer-history";

export default function VolunteerHistoryPage() {
  return (
    <main className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">Volunteer History</p>
        <h1 className="mt-2 font-display text-4xl font-semibold">Track your impact over time</h1>
      </div>
      <VolunteerHistory />
    </main>
  );
}
