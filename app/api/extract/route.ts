import { NextRequest, NextResponse } from "next/server";
import { verifyRequestUser } from "@/lib/firebase-admin";
import { extractNeedFromImage, extractNeedFromText } from "@/lib/google-ai";
import { createNeed } from "@/lib/server-data";

export async function POST(request: NextRequest) {
  const authUser = await verifyRequestUser(request);
  const body = (await request.json()) as { rawInput?: string; imageDataUrl?: string };
  const rawInput = body.rawInput?.trim() ?? "";

  if (!rawInput && !body.imageDataUrl) {
    return NextResponse.json({ message: "Missing intake payload." }, { status: 400 });
  }

  const extracted = body.imageDataUrl
    ? await extractNeedFromImage(body.imageDataUrl)
    : await extractNeedFromText(rawInput);

  const need = await createNeed(
    rawInput || "Vision survey intake",
    extracted,
    authUser?.uid ?? null
  );
  return NextResponse.json({ extracted, need });
}
