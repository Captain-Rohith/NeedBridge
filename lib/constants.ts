import { NeedCategory, VolunteerSkill } from "@/lib/types";

export const NEED_CATEGORIES: NeedCategory[] = [
  "food",
  "medical",
  "shelter",
  "education",
  "mental_health",
  "infrastructure",
  "other"
];

export const VOLUNTEER_SKILLS: VolunteerSkill[] = [
  "medical",
  "teaching",
  "cooking",
  "logistics",
  "counseling",
  "construction",
  "general"
];

export const categoryStyles: Record<NeedCategory, string> = {
  food: "bg-amber-100 text-amber-900",
  medical: "bg-red-100 text-red-900",
  shelter: "bg-sky-100 text-sky-900",
  education: "bg-indigo-100 text-indigo-900",
  mental_health: "bg-emerald-100 text-emerald-900",
  infrastructure: "bg-slate-200 text-slate-900",
  other: "bg-zinc-200 text-zinc-900"
};

export const categoryColors: Record<NeedCategory, string> = {
  food: "#f59e0b",
  medical: "#dc2626",
  shelter: "#0284c7",
  education: "#4f46e5",
  mental_health: "#059669",
  infrastructure: "#475569",
  other: "#78716c"
};
