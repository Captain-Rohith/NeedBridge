import { NextRequest, NextResponse } from "next/server";
import { verifyRequestUser } from "@/lib/firebase-admin";
import { getVolunteerHistory } from "@/lib/server-data";

export async function GET(request: NextRequest) {
  const authUser = await verifyRequestUser(request);
  if (!authUser) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const history = await getVolunteerHistory(authUser.uid);
  return NextResponse.json(history);
}
