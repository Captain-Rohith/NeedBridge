export type NeedCategory =
  | "food"
  | "medical"
  | "shelter"
  | "education"
  | "mental_health"
  | "infrastructure"
  | "other";

export type VolunteerSkill =
  | "medical"
  | "teaching"
  | "cooking"
  | "logistics"
  | "counseling"
  | "construction"
  | "general";

export type NeedStatus = "open" | "assigned" | "resolved";

export type Availability = "weekdays" | "weekends" | "both";
export type UserRole = "coordinator" | "volunteer" | "reporter";

export type NeedRecord = {
  id: string;
  raw_input: string;
  summary?: string;
  created_by_uid?: string | null;
  need_category: NeedCategory;
  location_description: string;
  lat: number;
  lng: number;
  urgency_score: number;
  beneficiary_count: number;
  status: NeedStatus;
  volunteer_id: string | null;
  created_at: string;
  ward: string;
  extraction_language?: string;
};

export type UserRecord = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  created_at: string;
};

export type VolunteerRecord = {
  id: string;
  name: string;
  phone: string;
  whatsapp: string;
  skills: VolunteerSkill[];
  availability: Availability;
  lat: number;
  lng: number;
  task_count_this_week: number;
  created_at: string;
  fcm_token?: string | null;
  linked_user_id?: string | null;
  preferred_categories?: NeedCategory[];
};

export type VolunteerInterestRecord = {
  id: string;
  uid: string;
  need_id: string;
  need_category: NeedCategory;
  status: "interested" | "shortlisted" | "assigned" | "declined" | "completed";
  created_at: string;
};

export type VolunteerActivityRecord = {
  id: string;
  uid: string;
  need_id?: string | null;
  type:
    | "profile_created"
    | "interest_registered"
    | "assigned"
    | "completed"
    | "declined";
  description: string;
  created_at: string;
};

export type ExtractedNeed = {
  summary: string;
  need_category: NeedCategory;
  location_description: string;
  urgency: number;
  estimated_beneficiaries: number;
  language_detected: string;
};

export type DashboardMetrics = {
  totalOpenNeeds: number;
  totalVolunteers: number;
  resolvedToday: number;
  averageResponseHours: number;
};

export type MatchResult = {
  needId: string;
  volunteerId: string;
  volunteerName: string;
  score: number;
  distanceKm: number;
};
