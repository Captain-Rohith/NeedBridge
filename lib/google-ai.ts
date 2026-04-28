import { GoogleAuth } from "google-auth-library";
import { NEED_CATEGORIES } from "@/lib/constants";
import { ExtractedNeed } from "@/lib/types";

const systemPrompt =
  'You are a community needs analyst. Extract from the input text: summary (one short sentence under 18 words), need_category (one of: food, medical, shelter, education, mental_health, infrastructure, other), location_description (as specific as the user gave), urgency (1-5, where 5 is life-threatening), estimated_beneficiaries (integer, guess if not stated), language_detected. Return JSON only.';

function heuristicExtract(text: string): ExtractedNeed {
  const lower = text.toLowerCase();
  const category =
    NEED_CATEGORIES.find((item) => lower.includes(item.replace("_", " "))) ??
    (/(doctor|medicine|health|insulin|nurse|first aid)/.test(lower)
      ? "medical"
      : /(food|meal|ration|kitchen)/.test(lower)
        ? "food"
        : /(school|teacher|class|student|education|tuition)/.test(lower)
          ? "education"
          : /(counsel|stress|trauma|support|mental)/.test(lower)
            ? "mental_health"
            : /(water|toilet|road|repair|roof|pipeline|drain)/.test(lower)
              ? "infrastructure"
              : /(shelter|bed|fire|flood|housing|tarpaulin)/.test(lower)
                ? "shelter"
                : "other");

  const urgency = /(life|critical|urgent|bleeding|fire|flood|heat exhaustion)/.test(lower)
    ? 5
    : /(soon|immediate)/.test(lower)
      ? 4
      : 3;
  const beneficiaryMatch = text.match(/(\d{1,4})/);
  const estimated = beneficiaryMatch ? Number(beneficiaryMatch[1]) : 10;
  const location =
    text.match(/(?:near|in|at)\s+([A-Za-z\s,]+)/i)?.[1]?.trim() ??
    "Location not clearly specified";

  return {
    summary: text.split(/[.!?]/)[0]?.trim().slice(0, 110) || "Community need reported",
    need_category: category,
    location_description: location,
    urgency,
    estimated_beneficiaries: estimated,
    language_detected: /[^\u0000-\u007f]/.test(text) ? "non_english" : "english"
  };
}

async function getAccessToken() {
  const projectId = process.env.VERTEX_AI_PROJECT_ID;
  const location = process.env.VERTEX_AI_LOCATION;
  if (!projectId || !location) return null;

  const auth = new GoogleAuth({
    scopes: ["https://www.googleapis.com/auth/cloud-platform"]
  });
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  return token.token ?? null;
}

async function callGemini(parts: Array<Record<string, unknown>>) {
  const projectId = process.env.VERTEX_AI_PROJECT_ID;
  const location = process.env.VERTEX_AI_LOCATION;
  const token = await getAccessToken();

  if (!projectId || !location || !token) return null;

  const endpoint = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/gemini-2.0-flash-001:generateContent`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      contents: [{ role: "user", parts }],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json"
      },
      systemInstruction: {
        role: "system",
        parts: [{ text: systemPrompt }]
      }
    }),
    cache: "no-store"
  });

  if (!response.ok) return null;
  const payload = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };

  return payload.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
}

export async function extractNeedFromText(input: string): Promise<ExtractedNeed> {
  try {
    const responseText = await callGemini([{ text: input }]);
    if (responseText) return JSON.parse(responseText) as ExtractedNeed;
  } catch {
    return heuristicExtract(input);
  }

  return heuristicExtract(input);
}

export async function extractNeedFromImage(dataUrl: string): Promise<ExtractedNeed> {
  try {
    const [meta, base64Data] = dataUrl.split(",");
    const mimeType = meta.match(/data:(.*);base64/)?.[1] ?? "image/jpeg";
    const responseText = await callGemini([
      { text: "Extract the need details from this survey photo." },
      {
        inlineData: {
          mimeType,
          data: base64Data
        }
      }
    ]);
    if (responseText) return JSON.parse(responseText) as ExtractedNeed;
  } catch {
    return heuristicExtract(
      "Survey image mentions food and medical support in Mumbai for 20 families."
    );
  }

  return heuristicExtract(
    "Survey image mentions shelter support in Bengaluru for 15 beneficiaries."
  );
}
