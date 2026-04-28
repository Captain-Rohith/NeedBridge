import { NextRequest, NextResponse } from "next/server";
import { verifyRequestUser } from "@/lib/firebase-admin";
import {
  createVolunteer,
  createVolunteerActivity,
  createVolunteerInterest,
  getNeedById,
  listVolunteers,
  upsertUser,
  upsertVolunteerProfile
} from "@/lib/server-data";
import { NeedCategory, UserRole, VolunteerSkill } from "@/lib/types";

export async function GET() {
  const volunteers = await listVolunteers();
  return NextResponse.json({ volunteers });
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    name: string;
    email?: string;
    phone: string;
    whatsapp: string;
    skills: VolunteerSkill[];
    availability: "weekdays" | "weekends" | "both";
    current_lat: number;
    current_lng: number;
    fcm_token?: string | null;
    need_id?: string | null;
    preferred_categories?: NeedCategory[];
  };

  const authUser = await verifyRequestUser(request);

  if (authUser) {
    await upsertUser({
      id: authUser.uid,
      name: body.name || authUser.name || "Volunteer",
      email: body.email || authUser.email || "",
      phone: body.phone,
      role: "volunteer" as UserRole
    });

    const volunteer = await upsertVolunteerProfile({
      id: authUser.uid,
      name: body.name || authUser.name || "Volunteer",
      phone: body.phone,
      whatsapp: body.whatsapp,
      skills: body.skills,
      availability: body.availability,
      lat: Number(body.current_lat),
      lng: Number(body.current_lng),
      fcm_token: body.fcm_token ?? null,
      task_count_this_week: 0,
      linked_user_id: authUser.uid,
      preferred_categories: body.preferred_categories,
      created_at: new Date().toISOString()
    });

    await createVolunteerActivity({
      uid: authUser.uid,
      type: "profile_created",
      description: "Updated volunteer profile",
      need_id: body.need_id ?? null
    });

    let interest = null;
    const targetNeed = body.need_id ? await getNeedById(body.need_id) : null;
    const interestCategory = targetNeed?.need_category ?? body.preferred_categories?.[0];
    if (body.need_id && interestCategory) {
      interest = await createVolunteerInterest({
        uid: authUser.uid,
        need_id: body.need_id,
        need_category: interestCategory
      });
      await createVolunteerActivity({
        uid: authUser.uid,
        need_id: body.need_id,
        type: "interest_registered",
        description: `Expressed interest in a ${interestCategory} need${
          targetNeed ? ` at ${targetNeed.location_description}` : ""
        }`
      });
    }

    return NextResponse.json({ volunteer, interest, mode: "authenticated" });
  }

  const volunteer = await createVolunteer({
    name: body.name,
    phone: body.phone,
    whatsapp: body.whatsapp,
    skills: body.skills,
    availability: body.availability,
    lat: Number(body.current_lat),
    lng: Number(body.current_lng),
    fcm_token: body.fcm_token ?? null,
    preferred_categories: body.preferred_categories
  });

  return NextResponse.json({ volunteer, mode: "guest" });
}
