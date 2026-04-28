import { NextRequest, NextResponse } from "next/server";
import { verifyRequestUser } from "@/lib/firebase-admin";
import { listVolunteers } from "@/lib/server-data";

export async function GET(request: NextRequest) {
  const authUser = await verifyRequestUser(request);
  if (!authUser) {
    return NextResponse.json({ volunteer: null });
  }

  const volunteers = await listVolunteers();
  const volunteer = volunteers.find((item) => item.id === authUser.uid) ?? null;
  return NextResponse.json({ volunteer });
}
