import { DashboardMetrics } from "@/lib/types";

export function MetricsRow({ metrics }: { metrics: DashboardMetrics }) {
  const items = [
    { label: "Open needs", value: metrics.totalOpenNeeds },
    { label: "Volunteers", value: metrics.totalVolunteers },
    { label: "Resolved today", value: metrics.resolvedToday },
    { label: "Avg response", value: `${metrics.averageResponseHours}h` }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="panel p-5">
          <p className="text-sm text-slate-500">{item.label}</p>
          <p className="mt-2 text-3xl font-semibold">{item.value}</p>
        </div>
      ))}
    </div>
  );
}
