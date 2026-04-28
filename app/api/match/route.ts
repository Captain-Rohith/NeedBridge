import { NextResponse } from "next/server";
import { runMatching } from "@/lib/server-data";

export async function POST() {
  const results = await runMatching();
  return NextResponse.json({ matched: results.length, results });
}
