"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { scoreSkillMatch } from "@/lib/skill-mapping";
import { NeedRecord } from "@/lib/types";

const MapView = dynamic(() => import("@/components/map-view"), {
  ssr: false,
  loading: () => <div className="h-[560px] w-full animate-pulse rounded-3xl bg-slate-100" />
});

export function MapClient({
  needs,
  apiKey
}: {
  needs: NeedRecord[];
  apiKey: string;
}) {
  const { user, getIdToken } = useAuth();
  const [profileSkills, setProfileSkills] = useState<string[]>([]);

  useEffect(() => {
    async function loadProfile() {
      if (!user) {
        setProfileSkills([]);
        return;
      }
      const token = await getIdToken();
      if (!token) return;

      const response = await fetch("/api/volunteers/me", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = (await response.json()) as { volunteer: { skills?: string[] } | null };
      setProfileSkills(data.volunteer?.skills ?? []);
    }

    void loadProfile();
  }, [getIdToken, user]);

  const matchedNeedIds = useMemo(
    () =>
      needs
        .filter((need) => scoreSkillMatch(need.need_category, profileSkills as any) > 0)
        .map((need) => need.id),
    [needs, profileSkills]
  );

  const prioritizedNeeds = useMemo(
    () =>
      [...needs].sort((a, b) => {
        const aMatch = matchedNeedIds.includes(a.id) ? 1 : 0;
        const bMatch = matchedNeedIds.includes(b.id) ? 1 : 0;
        if (aMatch !== bMatch) return bMatch - aMatch;
        return b.urgency_score - a.urgency_score;
      }),
    [matchedNeedIds, needs]
  );

  return (
    <div className="space-y-3">
      {user ? (
        <div className="rounded-2xl border border-teal-200 bg-teal-50 p-3 text-sm text-teal-900">
          <p className="font-semibold">Personalized volunteer view</p>
          <p className="mt-1">
            All open needs are visible. Needs matching your selected skills are highlighted and
            given priority on the map.
          </p>
        </div>
      ) : null}
      <MapView needs={prioritizedNeeds} apiKey={apiKey} matchedNeedIds={matchedNeedIds} />
    </div>
  );
}
