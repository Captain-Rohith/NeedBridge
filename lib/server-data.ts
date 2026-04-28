import { randomUUID } from "crypto";
import { seedNeeds, seedVolunteers } from "@/lib/demo-data";
import { getFirestoreAdmin } from "@/lib/firebase-admin";
import { geocodeLocation } from "@/lib/geo";
import { matchOpenNeeds } from "@/lib/matching";
import { notifyVolunteerAssignment } from "@/lib/notifications";
import {
  DashboardMetrics,
  ExtractedNeed,
  MatchResult,
  NeedRecord,
  NeedStatus,
  UserRecord,
  VolunteerActivityRecord,
  VolunteerInterestRecord,
  VolunteerRecord
} from "@/lib/types";

type DemoStore = {
  needs: NeedRecord[];
  volunteers: VolunteerRecord[];
  users: UserRecord[];
  interests: VolunteerInterestRecord[];
  activities: VolunteerActivityRecord[];
};

declare global {
  // eslint-disable-next-line no-var
  var needBridgeDemoStore: DemoStore | undefined;
}

function getDemoStore() {
  if (!globalThis.needBridgeDemoStore) {
    globalThis.needBridgeDemoStore = {
      needs: structuredClone(seedNeeds),
      volunteers: structuredClone(seedVolunteers),
      users: [],
      interests: [],
      activities: []
    };
  }
  return globalThis.needBridgeDemoStore;
}

function useFirestore() {
  return Boolean(getFirestoreAdmin());
}

async function ensureSeeded() {
  const firestore = getFirestoreAdmin();
  if (!firestore) return;

  try {
    const [needsSnapshot, volunteersSnapshot] = await Promise.all([
      firestore.collection("needs").limit(1).get(),
      firestore.collection("volunteers").limit(1).get()
    ]);

    if (!needsSnapshot.empty || !volunteersSnapshot.empty) return;

    const batch = firestore.batch();
    seedNeeds.forEach((need) => {
      batch.set(firestore.collection("needs").doc(need.id), need);
    });
    seedVolunteers.forEach((volunteer) => {
      batch.set(firestore.collection("volunteers").doc(volunteer.id), {
        ...volunteer,
        fcm_token: null
      });
    });
    await batch.commit();
  } catch {
    return;
  }
}

export async function listNeeds() {
  if (!useFirestore()) return getDemoStore().needs;

  try {
    const firestore = getFirestoreAdmin()!;
    await ensureSeeded();
    const snapshot = await firestore.collection("needs").get();
    const firestoreNeeds = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }) as NeedRecord)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
    return mergeNeedRecords(firestoreNeeds, getDemoStore().needs);
  } catch {
    return getDemoStore().needs;
  }
}

export async function getNeedById(needId: string) {
  const needs = await listNeeds();
  return needs.find((need) => need.id === needId) ?? null;
}

export async function listVolunteers() {
  if (!useFirestore()) return getDemoStore().volunteers;

  try {
    const firestore = getFirestoreAdmin()!;
    await ensureSeeded();
    const snapshot = await firestore.collection("volunteers").get();
    const firestoreVolunteers = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }) as VolunteerRecord)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
    return mergeVolunteerRecords(firestoreVolunteers, getDemoStore().volunteers);
  } catch {
    return getDemoStore().volunteers;
  }
}

export async function createNeed(
  rawInput: string,
  extracted: ExtractedNeed,
  createdByUid?: string | null
) {
  const coords = await geocodeLocation(extracted.location_description);
  const record: NeedRecord = {
    id: randomUUID(),
    raw_input: rawInput,
    summary: extracted.summary,
    created_by_uid: createdByUid ?? null,
    need_category: extracted.need_category,
    location_description: extracted.location_description,
    lat: coords.lat,
    lng: coords.lng,
    urgency_score: extracted.urgency,
    beneficiary_count: extracted.estimated_beneficiaries,
    status: "open",
    volunteer_id: null,
    created_at: new Date().toISOString(),
    ward: inferWard(extracted.location_description),
    extraction_language: extracted.language_detected
  };

  if (!useFirestore()) {
    getDemoStore().needs.unshift(record);
    return record;
  }

  try {
    const firestore = getFirestoreAdmin()!;
    await firestore.collection("needs").doc(record.id).set(record);
    return record;
  } catch {
    getDemoStore().needs.unshift(record);
    return record;
  }
}

export async function createVolunteer(
  volunteer: Omit<VolunteerRecord, "id" | "created_at" | "task_count_this_week">
) {
  const record: VolunteerRecord = {
    ...volunteer,
    id: randomUUID(),
    task_count_this_week: 0,
    created_at: new Date().toISOString(),
    fcm_token: volunteer.fcm_token ?? null
  };

  if (!useFirestore()) {
    getDemoStore().volunteers.unshift(record);
    return record;
  }

  try {
    const firestore = getFirestoreAdmin()!;
    await firestore.collection("volunteers").doc(record.id).set(record);
    return record;
  } catch {
    getDemoStore().volunteers.unshift(record);
    return record;
  }
}

export async function upsertUser(
  user: Omit<UserRecord, "created_at"> & { created_at?: string }
) {
  const record: UserRecord = {
    ...user,
    created_at: user.created_at ?? new Date().toISOString()
  };

  if (!useFirestore()) {
    const store = getDemoStore();
    const existing = store.users.findIndex((item) => item.id === record.id);
    if (existing >= 0) {
      store.users[existing] = { ...store.users[existing], ...record };
    } else {
      store.users.unshift(record);
    }
    return record;
  }

  try {
    const firestore = getFirestoreAdmin()!;
    const ref = firestore.collection("users").doc(record.id);
    const current = await ref.get();
    await ref.set(
      current.exists ? { ...current.data(), ...record } : record,
      { merge: true }
    );
    return record;
  } catch {
    return record;
  }
}

export async function upsertVolunteerProfile(
  volunteer: Omit<VolunteerRecord, "created_at"> & { created_at?: string }
) {
  const record: VolunteerRecord = {
    ...volunteer,
    created_at: volunteer.created_at ?? new Date().toISOString()
  };

  if (!useFirestore()) {
    const store = getDemoStore();
    const existing = store.volunteers.findIndex((item) => item.id === record.id);
    if (existing >= 0) {
      store.volunteers[existing] = { ...store.volunteers[existing], ...record };
    } else {
      store.volunteers.unshift(record);
    }
    return record;
  }

  try {
    const firestore = getFirestoreAdmin()!;
    await firestore.collection("volunteers").doc(record.id).set(record, { merge: true });
    return record;
  } catch {
    return record;
  }
}

export async function createVolunteerInterest(
  interest: Omit<VolunteerInterestRecord, "id" | "created_at" | "status"> & {
    status?: VolunteerInterestRecord["status"];
  }
) {
  const record: VolunteerInterestRecord = {
    id: randomUUID(),
    created_at: new Date().toISOString(),
    status: interest.status ?? "interested",
    ...interest
  };

  if (!useFirestore()) {
    getDemoStore().interests.unshift(record);
    return record;
  }

  try {
    const firestore = getFirestoreAdmin()!;
    await firestore.collection("volunteer_interests").doc(record.id).set(record);
    return record;
  } catch {
    getDemoStore().interests.unshift(record);
    return record;
  }
}

export async function createVolunteerActivity(
  activity: Omit<VolunteerActivityRecord, "id" | "created_at">
) {
  const record: VolunteerActivityRecord = {
    id: randomUUID(),
    created_at: new Date().toISOString(),
    ...activity
  };

  if (!useFirestore()) {
    getDemoStore().activities.unshift(record);
    return record;
  }

  try {
    const firestore = getFirestoreAdmin()!;
    await firestore.collection("volunteer_activity").doc(record.id).set(record);
    return record;
  } catch {
    getDemoStore().activities.unshift(record);
    return record;
  }
}

export async function getVolunteerHistory(uid: string) {
  if (!useFirestore()) {
    const store = getDemoStore();
    return {
      interests: store.interests.filter((item) => item.uid === uid),
      activities: store.activities.filter((item) => item.uid === uid)
    };
  }

  try {
    const firestore = getFirestoreAdmin()!;
    const [interestsSnapshot, activitiesSnapshot] = await Promise.all([
      firestore.collection("volunteer_interests").where("uid", "==", uid).get(),
      firestore.collection("volunteer_activity").where("uid", "==", uid).get()
    ]);

    const demoStore = getDemoStore();
    const demoInterests = demoStore.interests.filter((item) => item.uid === uid);
    const demoActivities = demoStore.activities.filter((item) => item.uid === uid);

    const firestoreInterests = interestsSnapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }) as VolunteerInterestRecord)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));

    const firestoreActivities = activitiesSnapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }) as VolunteerActivityRecord)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));

    return {
      interests: firestoreInterests.length > 0 ? firestoreInterests : demoInterests,
      activities: firestoreActivities.length > 0 ? firestoreActivities : demoActivities
    };
  } catch {
    const store = getDemoStore();
    return {
      interests: store.interests.filter((item) => item.uid === uid),
      activities: store.activities.filter((item) => item.uid === uid)
    };
  }
}

export async function updateNeedStatus(
  needId: string,
  status: NeedStatus,
  volunteerId: string | null
) {
  if (!useFirestore()) {
    const store = getDemoStore();
    store.needs = store.needs.map((need) =>
      need.id === needId ? { ...need, status, volunteer_id: volunteerId } : need
    );
    return;
  }

  try {
    const firestore = getFirestoreAdmin()!;
    await firestore.collection("needs").doc(needId).update({
      status,
      volunteer_id: volunteerId
    });
  } catch {
    const store = getDemoStore();
    store.needs = store.needs.map((need) =>
      need.id === needId ? { ...need, status, volunteer_id: volunteerId } : need
    );
  }
}

export async function deleteNeed(needId: string) {
  if (!useFirestore()) {
    const store = getDemoStore();
    store.needs = store.needs.filter((need) => need.id !== needId);
    store.interests = store.interests.filter((interest) => interest.need_id !== needId);
    store.activities = store.activities.filter((activity) => activity.need_id !== needId);
    return;
  }

  try {
    const firestore = getFirestoreAdmin()!;
    await firestore.collection("needs").doc(needId).delete();

    const [interestsSnapshot, activitiesSnapshot] = await Promise.all([
      firestore.collection("volunteer_interests").where("need_id", "==", needId).get(),
      firestore.collection("volunteer_activity").where("need_id", "==", needId).get()
    ]);

    const batch = firestore.batch();
    interestsSnapshot.docs.forEach((doc) => batch.delete(doc.ref));
    activitiesSnapshot.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
  } catch {
    const store = getDemoStore();
    store.needs = store.needs.filter((need) => need.id !== needId);
    store.interests = store.interests.filter((interest) => interest.need_id !== needId);
    store.activities = store.activities.filter((activity) => activity.need_id !== needId);
  }
}

async function incrementVolunteerTaskCount(volunteerId: string) {
  if (!useFirestore()) {
    const store = getDemoStore();
    store.volunteers = store.volunteers.map((volunteer) =>
      volunteer.id === volunteerId
        ? { ...volunteer, task_count_this_week: volunteer.task_count_this_week + 1 }
        : volunteer
    );
    return;
  }

  try {
    const firestore = getFirestoreAdmin()!;
    const ref = firestore.collection("volunteers").doc(volunteerId);
    const doc = await ref.get();
    const current = (doc.data()?.task_count_this_week as number | undefined) ?? 0;
    await ref.update({ task_count_this_week: current + 1 });
  } catch {
    const store = getDemoStore();
    store.volunteers = store.volunteers.map((volunteer) =>
      volunteer.id === volunteerId
        ? { ...volunteer, task_count_this_week: volunteer.task_count_this_week + 1 }
        : volunteer
    );
  }
}

export async function runMatching(): Promise<MatchResult[]> {
  const [needs, volunteers] = await Promise.all([listNeeds(), listVolunteers()]);
  const results = matchOpenNeeds(needs, volunteers);

  for (const result of results) {
    await updateNeedStatus(result.needId, "assigned", result.volunteerId);
    await incrementVolunteerTaskCount(result.volunteerId);

    const need = needs.find((item) => item.id === result.needId);
    const volunteer = volunteers.find((item) => item.id === result.volunteerId);
    if (need && volunteer) {
      if (volunteer.linked_user_id) {
        await createVolunteerActivity({
          uid: volunteer.linked_user_id,
          need_id: need.id,
          type: "assigned",
          description: `Assigned to ${need.need_category} support at ${need.location_description}`
        });
      }
      await notifyVolunteerAssignment(volunteer, {
        ...need,
        status: "assigned",
        volunteer_id: volunteer.id
      });
    }
  }

  return results;
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const [needs, volunteers] = await Promise.all([listNeeds(), listVolunteers()]);
  const today = new Date().toDateString();
  const resolvedToday = needs.filter(
    (need) =>
      need.status === "resolved" &&
      new Date(need.created_at).toDateString() === today
  ).length;
  const openNeeds = needs.filter((need) => need.status === "open");
  const averageResponseHours =
    needs
      .filter((need) => need.status !== "open")
      .reduce(
        (sum, need) =>
          sum + Math.max(1, (Date.now() - new Date(need.created_at).getTime()) / 36e5),
        0
      ) / Math.max(1, needs.filter((need) => need.status !== "open").length);

  return {
    totalOpenNeeds: openNeeds.length,
    totalVolunteers: volunteers.length,
    resolvedToday,
    averageResponseHours: Number(averageResponseHours.toFixed(1))
  };
}

export async function getUrgentOpenNeeds(limit = 5) {
  const needs = await listNeeds();
  return needs
    .filter((need) => need.status === "open")
    .sort(
      (a, b) =>
        b.urgency_score - a.urgency_score ||
        b.created_at.localeCompare(a.created_at)
    )
    .slice(0, limit);
}

function inferWard(location: string) {
  const cleaned = location.trim();
  const lower = cleaned.toLowerCase();

  const locality = cleaned
    .split(",")
    .map((part) => part.trim())
    .find((part) => {
      const normalized = part.toLowerCase();
      return !["mumbai", "delhi", "bengaluru", "bangalore", "india"].includes(normalized);
    });

  if (locality) return locality;
  if (lower.includes("mumbai")) return "Mumbai";
  if (lower.includes("delhi")) return "Delhi";
  if (lower.includes("bengaluru") || lower.includes("bangalore")) {
    return "Bengaluru";
  }
  return cleaned || "Unspecified";
}

function mergeNeedRecords(primary: NeedRecord[], fallback: NeedRecord[]) {
  const merged = new Map<string, NeedRecord>();
  [...primary, ...fallback]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .forEach((need) => {
      if (!merged.has(need.id)) {
        merged.set(need.id, need);
      }
    });
  return [...merged.values()];
}

function mergeVolunteerRecords(primary: VolunteerRecord[], fallback: VolunteerRecord[]) {
  const merged = new Map<string, VolunteerRecord>();
  [...primary, ...fallback]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .forEach((volunteer) => {
      if (!merged.has(volunteer.id)) {
        merged.set(volunteer.id, volunteer);
      }
    });
  return [...merged.values()];
}
