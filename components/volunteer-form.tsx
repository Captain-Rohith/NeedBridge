"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getToken } from "firebase/messaging";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { VOLUNTEER_SKILLS } from "@/lib/constants";
import { getBrowserMessaging } from "@/lib/firebase-client";
import { prefillSkillForCategory } from "@/lib/skill-mapping";
import { Availability, VolunteerSkill } from "@/lib/types";

export function VolunteerForm({ vapidKey }: { vapidKey: string }) {
  const searchParams = useSearchParams();
  const { user, getIdToken } = useAuth();
  const selectedCategory = searchParams.get("category");
  const targetNeedId = searchParams.get("needId");
  const targetLocation = searchParams.get("location");

  const initialSkills = useMemo(
    () => prefillSkillForCategory(selectedCategory as any),
    [selectedCategory]
  );

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [availability, setAvailability] = useState<Availability>("both");
  const [skills, setSkills] = useState<VolunteerSkill[]>(initialSkills);
  const [geo, setGeo] = useState<{ lat: number; lng: number } | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fcmToken, setFcmToken] = useState<string | null>(null);

  useEffect(() => {
    setSkills(initialSkills);
  }, [initialSkills]);

  useEffect(() => {
    if (!user) return;
    setName(user.displayName ?? "");
    setEmail(user.email ?? "");

    async function loadProfile() {
      const token = await getIdToken();
      if (!token) return;

      const response = await fetch("/api/volunteers/me", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = (await response.json()) as {
        volunteer: {
          phone?: string;
          whatsapp?: string;
          availability?: Availability;
          skills?: VolunteerSkill[];
          lat?: number;
          lng?: number;
        } | null;
      };

      if (!data.volunteer) return;
      setPhone(data.volunteer.phone ?? "");
      setWhatsapp(data.volunteer.whatsapp ?? "");
      setAvailability(data.volunteer.availability ?? "both");
      if (data.volunteer.skills?.length) {
        setSkills(data.volunteer.skills);
      }
      if (typeof data.volunteer.lat === "number" && typeof data.volunteer.lng === "number") {
        setGeo({ lat: data.volunteer.lat, lng: data.volunteer.lng });
      }
    }

    void loadProfile();
  }, [getIdToken, user]);

  useEffect(() => {
    async function prepareMessaging() {
      try {
        if (!("Notification" in window)) return;
        const permission = await Notification.requestPermission();
        if (permission !== "granted") return;

        const registration = await navigator.serviceWorker.register(
          "/firebase-messaging-sw.js"
        );
        const messaging = await getBrowserMessaging();
        if (!messaging || !vapidKey) return;

        const token = await getToken(messaging, {
          vapidKey,
          serviceWorkerRegistration: registration
        });

        if (token) setFcmToken(token);
      } catch {
        setFcmToken(null);
      }
    }

    void prepareMessaging();
  }, [vapidKey]);

  const toggleSkill = (skill: VolunteerSkill) => {
    setSkills((current) =>
      current.includes(skill)
        ? current.filter((item) => item !== skill)
        : [...current, skill]
    );
  };

  const locate = () => {
    navigator.geolocation.getCurrentPosition((position) => {
      setGeo({
        lat: position.coords.latitude,
        lng: position.coords.longitude
      });
    });
  };

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    const token = await getIdToken();
    const response = await fetch("/api/volunteers/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        name,
        email,
        phone,
        whatsapp,
        availability,
        current_lat: geo?.lat ?? 0,
        current_lng: geo?.lng ?? 0,
        skills,
        fcm_token: fcmToken,
        need_id: targetNeedId,
        preferred_categories: selectedCategory ? [selectedCategory] : []
      })
    });

    const payload = (await response.json()) as {
      volunteer?: { id: string };
      interest?: { id: string };
      mode?: "guest" | "authenticated";
    };

    setLoading(false);
    if (payload.mode === "authenticated" && payload.interest) {
      setMessage("Profile updated and your interest in this specific issue has been recorded.");
      return;
    }

    if (payload.mode === "authenticated") {
      setMessage("Your volunteer profile has been updated.");
      return;
    }

    setMessage(payload.volunteer ? `Registered volunteer ${payload.volunteer.id}` : "Registered");
    if (!user) {
      setName("");
      setEmail("");
      setPhone("");
      setWhatsapp("");
      setAvailability("both");
      setSkills(initialSkills);
    }
  };

  return (
    <div className="space-y-4">
      <div className="panel border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
        <p className="font-semibold text-slate-900">How your profile is used</p>
        <p className="mt-1">
          Your selected skills keep all open needs visible on the map, but matching need categories
          are highlighted first to help you discover the most relevant issues quickly.
        </p>
      </div>
      {targetNeedId && targetLocation ? (
        <div className="panel border border-accent/20 bg-teal-50 p-4 text-sm text-teal-900">
          <p className="font-semibold">Issue-specific volunteering</p>
          <p className="mt-1">
            You are responding to a {selectedCategory?.replaceAll("_", " ")} need at {targetLocation}.
          </p>
          {user ? (
            <p className="mt-2">
              Since you are signed in, we will record your interest for this exact issue and
              consider your profile for similar needs.
            </p>
          ) : (
            <p className="mt-2">
              You are currently joining as a general volunteer for this cause category.{" "}
              <Link
                href={`/auth?next=${encodeURIComponent(
                  `/volunteer/register?needId=${targetNeedId}&category=${selectedCategory ?? ""}&location=${targetLocation}`
                )}`}
                className="font-semibold underline"
              >
                Sign in
              </Link>{" "}
              if you want this linked to your future volunteer history.
            </p>
          )}
        </div>
      ) : null}

      <form className="panel space-y-6 p-6" onSubmit={onSubmit}>
        <div className="grid gap-4 md:grid-cols-2">
          <input
            className="input"
            name="name"
            placeholder="Full name"
            required
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          <input
            className="input"
            name="phone"
            placeholder="Phone number"
            required
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
          />
          <input
            className="input"
            name="whatsapp"
            placeholder="Alternate contact number"
            required
            value={whatsapp}
            onChange={(event) => setWhatsapp(event.target.value)}
          />
          <select
            className="input"
            name="availability"
            required
            value={availability}
            onChange={(event) => setAvailability(event.target.value as Availability)}
          >
            <option value="weekdays">Weekdays</option>
            <option value="weekends">Weekends</option>
            <option value="both">Both</option>
          </select>
          {user ? (
            <input className="input md:col-span-2" value={email} disabled readOnly />
          ) : null}
        </div>
        <div>
          <p className="mb-3 text-sm font-medium">Skills</p>
          <div className="flex flex-wrap gap-3">
            {VOLUNTEER_SKILLS.map((skill) => (
              <button
                key={skill}
                type="button"
                className={`rounded-full px-4 py-2 text-sm ${
                  skills.includes(skill)
                    ? "bg-accent text-white"
                    : "border border-slate-300 bg-white text-slate-700"
                }`}
                onClick={() => toggleSkill(skill)}
              >
                {skill}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <button type="button" className="button-secondary" onClick={locate}>
            Use current location
          </button>
          {geo ? (
            <p className="text-sm text-slate-500">
              Lat {geo.lat.toFixed(4)}, Lng {geo.lng.toFixed(4)}
            </p>
          ) : null}
        </div>
        <p className="text-sm text-slate-500">
          Push notifications: {fcmToken ? "enabled on this device" : "not yet enabled"}
        </p>
        <button className="button-primary" disabled={loading}>
          {loading
            ? "Saving..."
            : user && targetNeedId
              ? "Save profile and help this issue"
              : "Register volunteer"}
        </button>
        {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
      </form>
    </div>
  );
}
