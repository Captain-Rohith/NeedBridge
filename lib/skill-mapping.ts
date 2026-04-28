import { NeedCategory, VolunteerSkill } from "@/lib/types";

const categorySkillMap: Record<NeedCategory, VolunteerSkill[]> = {
  food: ["cooking", "logistics", "general"],
  medical: ["medical", "general"],
  shelter: ["construction", "logistics", "general"],
  education: ["teaching", "general"],
  mental_health: ["counseling", "general"],
  infrastructure: ["construction", "logistics", "general"],
  other: ["general"]
};

export function scoreSkillMatch(category: NeedCategory, skills: VolunteerSkill[]) {
  const aligned = categorySkillMap[category];
  if (skills.some((skill) => aligned.includes(skill) && skill !== "general")) return 1;
  if (skills.includes("general")) return 0.5;
  return 0;
}

export function prefillSkillForCategory(category?: NeedCategory): VolunteerSkill[] {
  if (!category) return [];
  return [...new Set(categorySkillMap[category])].filter((skill) => skill !== "general");
}
