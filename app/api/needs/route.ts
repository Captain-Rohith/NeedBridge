import { NextRequest, NextResponse } from "next/server";
import { verifyRequestUser } from "@/lib/firebase-admin";
import { deleteNeed, getUrgentOpenNeeds, listNeeds } from "@/lib/server-data";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = Number(searchParams.get("limit") ?? 0);
  const status = searchParams.get("status");

  let needs = status === "open" && limit > 0 ? await getUrgentOpenNeeds(limit) : await listNeeds();
  if (status && status !== "open") {
    needs = needs.filter((need) => need.status === status);
  }
  return NextResponse.json({ needs });
}

export async function DELETE(request: NextRequest) {
  const authUser = await verifyRequestUser(request);
  const { searchParams } = new URL(request.url);
  const needId = searchParams.get("id");

  if (!needId) {
    return NextResponse.json({ message: "Missing need id." }, { status: 400 });
  }

  if (!authUser) {
    return NextResponse.json({ message: "Sign in required." }, { status: 401 });
  }

  const needs = await listNeeds();
  const need = needs.find((item) => item.id === needId);
  if (!need) {
    return NextResponse.json({ message: "Need not found." }, { status: 404 });
  }

  if (need.created_by_uid !== authUser.uid) {
    return NextResponse.json(
      { message: "You can only delete needs you created." },
      { status: 403 }
    );
  }

  await deleteNeed(needId);
  return NextResponse.json({ deleted: true, needId });
}
