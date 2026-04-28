"use client";

import { useMemo, useState, useTransition } from "react";
import { useAuth } from "@/components/auth-provider";
import { CategoryBadge, StatusBadge } from "@/components/status-badge";
import { NeedCategory, NeedRecord, NeedStatus, VolunteerRecord } from "@/lib/types";
import { formatRelativeTime } from "@/lib/utils";

type Props = {
  needs: NeedRecord[];
  volunteers: VolunteerRecord[];
};

export function DashboardClient({ needs, volunteers }: Props) {
  const { user, getIdToken } = useAuth();
  const [category, setCategory] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [isPending, startTransition] = useTransition();

  const volunteerLookup = useMemo(
    () => Object.fromEntries(volunteers.map((volunteer) => [volunteer.id, volunteer.name])),
    [volunteers]
  );

  const filteredNeeds = useMemo(
    () =>
      needs.filter((need) => {
        const categoryOk = category === "all" || need.need_category === category;
        const statusOk = status === "all" || need.status === status;
        return categoryOk && statusOk;
      }),
    [category, needs, status]
  );

  const runMatching = () => {
    startTransition(async () => {
      await fetch("/api/match", { method: "POST" });
      window.location.reload();
    });
  };

  const removeNeed = (needId: string) => {
    startTransition(async () => {
      const token = await getIdToken();
      await fetch(`/api/needs?id=${encodeURIComponent(needId)}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      window.location.reload();
    });
  };

  return (
    <div className="space-y-6">
      <div className="panel p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-3 md:flex-row">
            <select className="input md:w-48" value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="all">All categories</option>
              {["food", "medical", "shelter", "education", "mental_health", "infrastructure", "other"].map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <select className="input md:w-40" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="all">All status</option>
              {["open", "assigned", "resolved"].map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          <button className="button-primary" onClick={runMatching} disabled={isPending}>
            {isPending ? "Running..." : "Run matching"}
          </button>
        </div>
      </div>

      <div className="panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-5 py-4">Category</th>
                <th className="px-5 py-4">Location</th>
                <th className="px-5 py-4">Urgency</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Assigned volunteer</th>
                <th className="px-5 py-4">Time open</th>
                <th className="px-5 py-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredNeeds.map((need) => (
                <tr key={need.id} className="border-t border-slate-100">
                  <td className="px-5 py-4"><CategoryBadge category={need.need_category as NeedCategory} /></td>
                  <td className="px-5 py-4">{need.location_description}</td>
                  <td className="px-5 py-4">{need.urgency_score}/5</td>
                  <td className="px-5 py-4"><StatusBadge status={need.status as NeedStatus} /></td>
                  <td className="px-5 py-4">{need.volunteer_id ? volunteerLookup[need.volunteer_id] ?? "Unknown" : "Unassigned"}</td>
                  <td className="px-5 py-4">{formatRelativeTime(need.created_at)}</td>
                  <td className="px-5 py-4">
                    {user && need.created_by_uid === user.uid ? (
                      <button
                        type="button"
                        className="rounded-full border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50"
                        onClick={() => removeNeed(need.id)}
                        disabled={isPending}
                      >
                        Delete
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400">No access</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
