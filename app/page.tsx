import { MapClient } from "@/components/map-client";
import { SignalPulse } from "@/components/signal-pulse";
import { listNeeds, getUrgentOpenNeeds } from "@/lib/server-data";

export default async function HomePage() {
  const needs = await listNeeds();
  const urgentNeeds = await getUrgentOpenNeeds();
  const mapsApiKey =
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ??
    process.env.GOOGLE_MAPS_API_KEY ??
    "";
  const openNeeds = needs.filter((need) => need.status === "open");
  const wardCounts = Object.entries(
    openNeeds.reduce<Record<string, number>>((acc, need) => {
      acc[need.ward] = (acc[need.ward] ?? 0) + 1;
      return acc;
    }, {})
  );

  return (
    <main className="space-y-8">
      <section className="grid gap-6 lg:grid-cols-[1.5fr_0.8fr]">
        <div className="panel overflow-hidden p-4">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">Public Heatmap</p>
              <h1 className="mt-1 font-display text-4xl font-semibold">
                Open needs across active city zones
              </h1>
            </div>
            <div className="flex flex-wrap gap-2">
              {wardCounts.map(([ward, count]) => (
                <span key={ward} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                  {ward}: {count}
                </span>
              ))}
            </div>
          </div>
          <MapClient needs={openNeeds} apiKey={mapsApiKey} />
        </div>
        <SignalPulse initialNeeds={urgentNeeds} />
      </section>
    </main>
  );
}
