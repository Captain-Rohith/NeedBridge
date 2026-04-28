const knownLocations: Record<string, { lat: number; lng: number }> = {
  "dharavi, mumbai": { lat: 19.0477, lng: 72.8581 },
  "govandi, mumbai": { lat: 19.0552, lng: 72.9163 },
  "kurla, mumbai": { lat: 19.0728, lng: 72.8826 },
  "chembur, mumbai": { lat: 19.0522, lng: 72.9005 },
  "bandra kurla complex, mumbai": { lat: 19.0607, lng: 72.8697 },
  "seelampur, delhi": { lat: 28.6692, lng: 77.269 },
  "anand vihar, delhi": { lat: 28.6469, lng: 77.3151 },
  "okhla phase 2, delhi": { lat: 28.5307, lng: 77.2757 },
  "sangam vihar, delhi": { lat: 28.5075, lng: 77.231 },
  "jahangirpuri, delhi": { lat: 28.7265, lng: 77.1624 },
  "shivaji nagar, bengaluru": { lat: 12.9982, lng: 77.6201 },
  "kr puram, bengaluru": { lat: 13.0071, lng: 77.6953 },
  "yeshwanthpur, bengaluru": { lat: 13.0285, lng: 77.5443 },
  "ejipura, bengaluru": { lat: 12.9457, lng: 77.6262 },
  "tannery road, bengaluru": { lat: 12.9918, lng: 77.6173 },
  mumbai: { lat: 19.076, lng: 72.8777 },
  delhi: { lat: 28.6139, lng: 77.209 },
  bengaluru: { lat: 12.9716, lng: 77.5946 }
};

export function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number) {
  const r = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const q1 = Math.sin(dLat / 2) ** 2;
  const q2 =
    Math.cos((aLat * Math.PI) / 180) *
    Math.cos((bLat * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return 2 * r * Math.asin(Math.sqrt(q1 + q2));
}

export async function geocodeLocation(locationDescription: string) {
  const normalized = locationDescription.trim().toLowerCase();
  if (knownLocations[normalized]) return knownLocations[normalized];

  const apiKey =
    process.env.GOOGLE_GEOCODING_API_KEY ?? process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return inferCityCoordinates(locationDescription);
  }

  const endpoint = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
    locationDescription
  )}&key=${apiKey}&region=in`;

  try {
    const response = await fetch(endpoint, { cache: "no-store" });
    const payload = (await response.json()) as {
      results?: Array<{ geometry: { location: { lat: number; lng: number } } }>;
    };
    const first = payload.results?.[0];
    if (first) return first.geometry.location;
  } catch {
    return inferCityCoordinates(locationDescription);
  }

  return inferCityCoordinates(locationDescription);
}

function inferCityCoordinates(locationDescription: string) {
  const normalized = locationDescription.toLowerCase();
  if (normalized.includes("mumbai")) return knownLocations.mumbai;
  if (normalized.includes("delhi")) return knownLocations.delhi;
  if (normalized.includes("bengaluru") || normalized.includes("bangalore")) {
    return knownLocations.bengaluru;
  }
  return { lat: 20.5937, lng: 78.9629 };
}
