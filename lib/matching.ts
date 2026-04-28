import { haversineKm } from "@/lib/geo";
import { scoreSkillMatch } from "@/lib/skill-mapping";
import { MatchResult, NeedRecord, VolunteerRecord } from "@/lib/types";

export function matchOpenNeeds(
  needs: NeedRecord[],
  volunteers: VolunteerRecord[]
): MatchResult[] {
  return needs
    .filter((need) => need.status === "open" && !need.volunteer_id)
    .map((need) => {
      const ranked = volunteers
        .map((volunteer) => {
          const distanceKm = Math.max(
            haversineKm(need.lat, need.lng, volunteer.lat, volunteer.lng),
            0.5
          );
          const skillMatch = scoreSkillMatch(need.need_category, volunteer.skills);
          const weeklyLoad = Math.max(volunteer.task_count_this_week, 0) + 1;
          const score =
            0.4 * skillMatch + 0.4 * (1 / distanceKm) + 0.2 * (1 / weeklyLoad);
          return { volunteer, score, distanceKm };
        })
        .sort((a, b) => b.score - a.score);

      const best = ranked[0];
      return {
        needId: need.id,
        volunteerId: best.volunteer.id,
        volunteerName: best.volunteer.name,
        score: Number(best.score.toFixed(4)),
        distanceKm: Number(best.distanceKm.toFixed(2))
      };
    });
}
