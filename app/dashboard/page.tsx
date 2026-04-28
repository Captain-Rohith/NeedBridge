import { DashboardClient } from "@/components/dashboard-client";
import { MetricsRow } from "@/components/metrics-row";
import { getDashboardMetrics, listNeeds, listVolunteers } from "@/lib/server-data";

export default async function DashboardPage() {
  const [needs, volunteers, metrics] = await Promise.all([
    listNeeds(),
    listVolunteers(),
    getDashboardMetrics()
  ]);

  return (
    <main className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">Coordinator View</p>
        <h1 className="mt-2 font-display text-4xl font-semibold">Response operations dashboard</h1>
      </div>
      <MetricsRow metrics={metrics} />
      <DashboardClient needs={needs} volunteers={volunteers} />
    </main>
  );
}
