"use client";

import { importLibrary, setOptions } from "@googlemaps/js-api-loader";
import { useEffect, useRef } from "react";
import { categoryColors } from "@/lib/constants";
import { NeedRecord } from "@/lib/types";
import { formatCategory } from "@/lib/utils";

export default function MapView({
  needs,
  apiKey,
  matchedNeedIds
}: {
  needs: NeedRecord[];
  apiKey: string;
  matchedNeedIds: string[];
}) {
  const mapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let mounted = true;

    async function renderMap() {
      if (!mapRef.current || !apiKey) return;

      setOptions({
        key: apiKey
      });

      await Promise.all([importLibrary("maps"), importLibrary("marker")]);
      if (!mounted || !mapRef.current) return;

      const map = new google.maps.Map(mapRef.current, {
        center: { lat: 20.5937, lng: 78.9629 },
        zoom: 5,
        streetViewControl: false,
        fullscreenControl: false
      });

      const infoWindow = new google.maps.InfoWindow();
      const bounds = new google.maps.LatLngBounds();

      needs.forEach((need) => {
        const position = { lat: need.lat, lng: need.lng };
        bounds.extend(position);

        const marker = new google.maps.Marker({
          position,
          map,
          title: `${formatCategory(need.need_category)} at ${need.location_description}`,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: categoryColors[need.need_category],
            fillOpacity: matchedNeedIds.includes(need.id) ? 1 : 0.82,
            strokeColor: matchedNeedIds.includes(need.id) ? "#111827" : "#ffffff",
            strokeWeight: matchedNeedIds.includes(need.id) ? 3 : 2,
            scale: 6 + need.urgency_score * 2 + (matchedNeedIds.includes(need.id) ? 3 : 0)
          },
          zIndex: 10 + need.urgency_score + (matchedNeedIds.includes(need.id) ? 20 : 0)
        });

        const circle = new google.maps.Circle({
          strokeColor: categoryColors[need.need_category],
          strokeOpacity: 0.35,
          strokeWeight: 1,
          fillColor: categoryColors[need.need_category],
          fillOpacity: 0.14,
          map,
          center: position,
          radius: 12000 + need.urgency_score * 3000
        });

        marker.addListener("click", () => {
          infoWindow.setContent(
            `<div style="min-width:180px">
              <strong style="text-transform:capitalize">${formatCategory(need.need_category)}</strong>
              <div>${need.location_description}</div>
              <div>${need.summary ?? need.raw_input}</div>
              <div>Urgency: ${need.urgency_score}/5</div>
              <div>Beneficiaries: ${need.beneficiary_count}</div>
              <div>${matchedNeedIds.includes(need.id) ? "Matches your volunteer skills" : "Visible to all volunteers"}</div>
            </div>`
          );
          infoWindow.open({
            map,
            anchor: marker
          });
        });

        circle.addListener("click", () => {
          google.maps.event.trigger(marker, "click");
        });
      });

      if (!bounds.isEmpty()) {
        map.fitBounds(bounds, 80);
      }
    }

    void renderMap();

    return () => {
      mounted = false;
    };
  }, [apiKey, matchedNeedIds, needs]);

  return (
    <div
      ref={mapRef}
      className="h-[560px] w-full rounded-3xl bg-slate-100"
      aria-label="NeedBridge public needs map"
    />
  );
}
