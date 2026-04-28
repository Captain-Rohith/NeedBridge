import { NextRequest, NextResponse } from "next/server";
import { extractNeedFromText } from "@/lib/google-ai";
import { createNeed } from "@/lib/server-data";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const body = String(formData.get("Body") ?? formData.get("body") ?? "").trim();
  const from = String(formData.get("From") ?? "unknown");

  if (!body) {
    return NextResponse.json({ message: "SMS body missing." }, { status: 400 });
  }

  const extracted = await extractNeedFromText(body);
  const need = await createNeed(`SMS from ${from}: ${body}`, extracted);

  return NextResponse.json({
    message: "SMS intake processed",
    mode: "google_stub",
    need
  });
}
