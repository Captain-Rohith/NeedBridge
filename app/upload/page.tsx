import { UploadForm } from "@/components/upload-form";

export default function UploadPage() {
  return (
    <main className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">Survey Upload</p>
        <h1 className="mt-2 font-display text-4xl font-semibold">Create a need from a paper survey</h1>
      </div>
      <UploadForm />
    </main>
  );
}
