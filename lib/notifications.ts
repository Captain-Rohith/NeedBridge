import { getFirebaseAdminApp, getFirestoreAdmin } from "@/lib/firebase-admin";
import { getMessaging } from "firebase-admin/messaging";
import { NeedRecord, VolunteerRecord } from "@/lib/types";

export async function notifyVolunteerAssignment(
  volunteer: VolunteerRecord,
  need: NeedRecord
) {
  const confirmUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/volunteer/register?assignedNeed=${need.id}`;
  const body = `NeedBridge alert: ${need.need_category} support needed at ${need.location_description}. Urgency ${need.urgency_score}/5. Confirm: ${confirmUrl}`;

  if (!volunteer.fcm_token) {
    return { mode: "mock", body, reason: "missing_fcm_token" };
  }

  const adminApp = getFirebaseAdminApp();
  if (!adminApp) {
    return { mode: "mock", body, reason: "firebase_admin_unavailable" };
  }

  const firestore = getFirestoreAdmin();
  if (firestore) {
    await firestore.collection("notifications").add({
      volunteerId: volunteer.id,
      needId: need.id,
      body,
      channel: "fcm",
      created_at: new Date().toISOString()
    });
  }

  await getMessaging(adminApp).send({
    token: volunteer.fcm_token,
    notification: {
      title: "NeedBridge assignment",
      body
    },
    data: {
      needId: need.id,
      volunteerId: volunteer.id,
      confirmUrl
    }
  });

  return { mode: "fcm", body };
}
