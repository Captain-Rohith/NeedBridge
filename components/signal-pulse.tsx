"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { NeedRecord } from "@/lib/types";
import { firestore } from "@/lib/firebase-client";
import { toDots } from "@/lib/utils";
import { CategoryBadge } from "@/components/status-badge";

export function SignalPulse({ initialNeeds }: { initialNeeds: NeedRecord[] }) {
  const [needs, setNeeds] = useState(initialNeeds);

  useEffect(() => {
    let active = true;

    const refreshFromApi = async () => {
      try {
        const response = await fetch("/api/needs?limit=5&status=open", {
          cache: "no-store"
        });
        const data = (await response.json()) as { needs: NeedRecord[] };
        if (!active) return;
        if (data.needs.length > 0) {
          setNeeds(data.needs);
        }
      } catch {
        return;
      }
    };

    const unsubscribe = onSnapshot(
      collection(firestore, "needs"),
      (snapshot) => {
        const next = snapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }) as NeedRecord)
          .filter((need) => need.status === "open")
          .sort(
            (a, b) =>
              b.urgency_score - a.urgency_score ||
              b.created_at.localeCompare(a.created_at)
          )
          .slice(0, 5);
        if (next.length > 0) {
          setNeeds(next);
          return;
        }

        if (initialNeeds.length > 0) {
          void refreshFromApi();
        }
      },
      async () => {
        await refreshFromApi();
      }
    );

    return () => {
      active = false;
      unsubscribe();
    };
  }, [initialNeeds]);

  return (
    <aside className="panel h-fit p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-accent">Signal Pulse</p>
          <h2 className="mt-1 text-2xl font-semibold">Top urgent unmet needs</h2>
        </div>
        <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-900">
          Live
        </span>
      </div>
      <p className="mt-3 text-sm text-slate-500">
        This widget shows only the top 5 highest-urgency open needs. Lower-urgency reports still
        appear on the main map.
      </p>
      <div className="mt-4 space-y-3">
        {needs.map((need) => (
          <div key={need.id} className="rounded-2xl border border-slate-200 p-4">
            <div className="flex items-start justify-between gap-3">
              <CategoryBadge category={need.need_category} />
              <div className="flex gap-1">
                {toDots(need.urgency_score).map((filled, index) => (
                  <span
                    key={`${need.id}-${index}`}
                    className={`h-2.5 w-2.5 rounded-full ${filled ? "bg-red-500" : "bg-slate-200"}`}
                  />
                ))}
              </div>
            </div>
            <p className="mt-3 text-sm text-slate-700">{need.location_description}</p>
            <p className="mt-2 text-sm text-slate-500">{need.summary ?? need.raw_input}</p>
            <Link
              href={`/volunteer/register?needId=${need.id}&category=${need.need_category}&location=${encodeURIComponent(need.location_description)}`}
              className="button-secondary mt-4 w-full"
            >
              I can help
            </Link>
          </div>
        ))}
        {needs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
            No urgent unmet needs are available right now.
          </div>
        ) : null}
      </div>
    </aside>
  );
}
