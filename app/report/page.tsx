import { ReportForm } from "@/components/report-form";

export default function ReportPage() {
  return (
    <main className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">Community Intake</p>
        <h1 className="mt-2 font-display text-4xl font-semibold">Create a need in plain language</h1>
      </div>
      <ReportForm />
    </main>
  );
}
