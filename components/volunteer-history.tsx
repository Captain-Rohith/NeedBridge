"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { CategoryBadge } from "@/components/status-badge";
import { VolunteerActivityRecord, VolunteerInterestRecord } from "@/lib/types";
import { formatRelativeTime } from "@/lib/utils";

export function VolunteerHistory() {
  const { user, getIdToken, loading } = useAuth();
  const [interests, setInterests] = useState<VolunteerInterestRecord[]>([]);
  const [activities, setActivities] = useState<VolunteerActivityRecord[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "signed_out">("loading");

  useEffect(() => {
    async function loadHistory() {
      if (loading) return;
      if (!user) {
        setState("signed_out");
        return;
      }

      const token = await getIdToken();
      if (!token) {
        setState("signed_out");
        return;
      }

      const response = await fetch("/api/volunteers/history", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = (await response.json()) as {
        interests: VolunteerInterestRecord[];
        activities: VolunteerActivityRecord[];
      };
      setInterests(data.interests ?? []);
      setActivities(data.activities ?? []);
      setState("ready");
    }

    void loadHistory();
  }, [getIdToken, loading, user]);

  if (state === "loading") {
    return <div className="panel p-6 text-sm text-slate-500">Loading your contribution history...</div>;
  }

  if (state === "signed_out") {
    return <div className="panel p-6 text-sm text-slate-500">Sign in to see your volunteer history.</div>;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="panel p-6">
        <h2 className="text-2xl font-semibold">Issue interests</h2>
        <div className="mt-4 space-y-3">
          {interests.length === 0 ? (
            <p className="text-sm text-slate-500">No issue interests recorded yet.</p>
          ) : (
            interests.map((interest) => (
              <div key={interest.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex items-center justify-between gap-3">
                  <CategoryBadge category={interest.need_category} />
                  <span className="text-xs text-slate-500">{formatRelativeTime(interest.created_at)} ago</span>
                </div>
                <p className="mt-2 text-sm text-slate-700">Need ID: {interest.need_id}</p>
                <p className="mt-1 text-sm font-medium capitalize text-slate-900">{interest.status}</p>
              </div>
            ))
          )}
        </div>
      </section>
      <section className="panel p-6">
        <h2 className="text-2xl font-semibold">Contribution timeline</h2>
        <div className="mt-4 space-y-3">
          {activities.length === 0 ? (
            <p className="text-sm text-slate-500">No volunteer activity recorded yet.</p>
          ) : (
            activities.map((activity) => (
              <div key={activity.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold capitalize text-slate-900">
                    {activity.type.replaceAll("_", " ")}
                  </p>
                  <span className="text-xs text-slate-500">{formatRelativeTime(activity.created_at)} ago</span>
                </div>
                <p className="mt-2 text-sm text-slate-700">{activity.description}</p>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
