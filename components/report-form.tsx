"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { ExtractedNeed } from "@/lib/types";

export function ReportForm() {
  const { getIdToken } = useAuth();
  const [description, setDescription] = useState("");
  const [geo, setGeo] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [extracted, setExtracted] = useState<ExtractedNeed | null>(null);
  const [loading, setLoading] = useState(false);

  const captureGeo = () => {
    navigator.geolocation.getCurrentPosition((position) => {
      setGeo(`${position.coords.latitude}, ${position.coords.longitude}`);
    });
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setResult(null);
    setExtracted(null);

    const imageDataUrl = file
      ? await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.onerror = reject;
          reader.readAsDataURL(file);
        })
      : undefined;

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...(await getAuthHeader(getIdToken))
    };

    const response = await fetch("/api/extract", {
      method: "POST",
      headers,
      body: JSON.stringify({
        rawInput: geo ? `${description}\nGPS: ${geo}` : description,
        imageDataUrl
      })
    });
    const data = (await response.json()) as {
      need?: { id: string };
      extracted?: ExtractedNeed;
      message?: string;
    };
    setLoading(false);
    setDescription("");
    setFile(null);
    setExtracted(data.extracted ?? null);
    setResult(data.need ? `Need recorded with ID ${data.need.id}` : data.message ?? "Submitted");
  };

  return (
    <form className="panel space-y-5 p-6" onSubmit={onSubmit}>
      <div>
        <label className="mb-2 block text-sm font-medium">Describe the community need</label>
        <textarea
          className="input min-h-40"
          placeholder="Example: 30 families in Govandi need cooked meals and two diabetic elders need medicine refills."
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          required
        />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <input
          className="input"
          type="file"
          accept="image/*"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
        />
        <button type="button" className="button-secondary" onClick={captureGeo}>
          Use my location
        </button>
      </div>
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
        <p className="font-semibold text-slate-900">How this works</p>
        <p className="mt-1">
          Google Gemini reads your report, creates a short summary, classifies the need,
          estimates urgency from 1 to 5, and stores it on the map.
        </p>
      </div>
      {geo ? <p className="text-sm text-slate-500">Captured geolocation: {geo}</p> : null}
      <button className="button-primary" disabled={loading}>
        {loading ? "Analyzing..." : "Submit need"}
      </button>
      {result ? <p className="text-sm text-emerald-700">{result}</p> : null}
      {extracted ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          <p className="font-semibold">Gemini summary</p>
          <p className="mt-1">{extracted.summary}</p>
          <p className="mt-2">
            Urgency: {extracted.urgency}/5. Signal Pulse only shows the top 5 most urgent
            open needs, so lower-urgency reports may appear on the map but not in that widget.
          </p>
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
