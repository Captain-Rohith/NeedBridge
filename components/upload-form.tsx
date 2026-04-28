"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { ExtractedNeed } from "@/lib/types";

export function UploadForm() {
  const { getIdToken } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [extracted, setExtracted] = useState<ExtractedNeed | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file) return;

    setLoading(true);
    setExtracted(null);
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...(await getAuthHeader(getIdToken))
    };

    const response = await fetch("/api/extract", {
      method: "POST",
      headers,
      body: JSON.stringify({ imageDataUrl: dataUrl, rawInput: `Survey photo upload: ${file.name}` })
    });

    const payload = (await response.json()) as {
      need?: { id: string };
      extracted?: ExtractedNeed;
      message?: string;
    };
    setLoading(false);
    setExtracted(payload.extracted ?? null);
    setMessage(payload.need ? `Survey processed into need ${payload.need.id}` : payload.message ?? "Processed");
    setFile(null);
  };

  return (
    <form className="panel space-y-5 p-6" onSubmit={onSubmit}>
      <div>
        <label className="mb-2 block text-sm font-medium">Upload a paper survey photo</label>
        <input
          className="input"
          type="file"
          accept="image/*"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          required
        />
      </div>
      <p className="text-sm text-slate-500">
        Survey extraction uses Google Gemini and falls back to a realistic demo response if Google services are unavailable.
      </p>
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
        <p className="font-semibold text-slate-900">What to upload</p>
        <p className="mt-1">
          Upload a clear photo of a paper survey sheet, handwritten field note, printed intake
          form, or on-ground assessment page that describes a community need.
        </p>
      </div>
      <button className="button-primary" disabled={loading}>
        {loading ? "Extracting..." : "Process survey"}
      </button>
      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
      {extracted ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          <p className="font-semibold">Gemini summary</p>
          <p className="mt-1">{extracted.summary}</p>
          <p className="mt-2">Urgency: {extracted.urgency}/5</p>
        </div>
      ) : null}
    </form>
  );
}

async function getAuthHeader(
  getIdToken: () => Promise<string | null>
): Promise<Record<string, string>> {
  const token = await getIdToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
