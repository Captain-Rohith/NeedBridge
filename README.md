## visit this for prototype: [https://needbridge-890086596571.asia-south1.run.app/](https://needbridge-890086596571.asia-south1.run.app/)


# NeedBridge

NeedBridge is a Google-first volunteer coordination platform for NGOs and social impact groups. It collects community need reports, uses Google Gemini to extract structured need data, visualizes open needs on a public map, and helps volunteers discover and respond to relevant issues.

## Current Product Flow

### Public users
- View all open needs on the public heatmap at `/`
- See the `Signal Pulse` widget with the top 5 highest-urgency unmet needs
- Click `I can help` on a specific issue to enter the volunteer flow

### Volunteers
- Sign in or create an account at `/auth`
- Set up or update a volunteer profile at `/volunteer/register`
- Select skills, availability, location, and contact details
- View contribution and issue-interest history at `/volunteer/history`

### Need reporters
- Create a need from plain text at `/report`
- Create a need from a paper survey image at `/upload`

### Coordinators
- Review all needs and metrics at `/dashboard`
- Run matching for open needs from the dashboard

## What The App Does Today

- Uses **Google Gemini via Vertex AI** to extract:
  - summary
  - need category
  - location description
  - urgency
  - estimated beneficiaries
  - language detected
- Uses **Google Geocoding API** to convert extracted location text into map coordinates
- Uses **Google Maps** to display all open needs
- Uses **Firebase Firestore** for persisted needs, volunteers, interests, and activity history when available
- Uses **Firebase Authentication** for volunteer sign-in and account creation
- Uses **Firebase Cloud Messaging** for volunteer notification plumbing

## Personalized Volunteer Behavior

- The `Volunteer` tab is the volunteer profile section
- A signed-in volunteer’s selected skills are used to **highlight and prioritize relevant needs on the map**
- All open needs remain visible on the map
- `Signal Pulse` is still urgency-first and currently shows the top 5 highest-urgency open needs overall
- If a signed-in volunteer clicks `I can help`, the app records interest in that exact issue

## Need Creation Behavior

### Report Need
Use `/report` to create a need from text.

The app:
1. stores the original input
2. asks Gemini to create a short summary and extract structured fields
3. geocodes the location
4. stores the resulting need record

### Upload Survey
Use `/upload` to create a need from an image of:
- a paper survey sheet
- a field intake form
- a handwritten assessment note
- a photographed printed report

The uploaded image is used for extraction. It is **not currently displayed back in the UI as an attachment preview** after submission.

## Signal Pulse Behavior

`Signal Pulse` does **not** show every need.

It shows only:
- the top 5 highest-urgency open unmet needs

So a newly reported need may:
- appear on the map
- but not appear in `Signal Pulse`

if its urgency is lower than the top current entries.

## Persistence Behavior

The intended persistent backend is **Firebase Firestore**.

The app can fall back to an in-memory demo store when Firestore or other backend services are unavailable. That means:
- data may appear to work during a dev session
- but disappear after restarting `npm run dev`

For full persistence, make sure:
- Firestore Database has actually been created in Firebase Console
- Cloud Firestore API is enabled
- Firebase Authentication is configured if using sign-in

## Tech Stack

- Next.js 14 App Router
- TypeScript
- Tailwind CSS
- Firebase Authentication
- Firebase Firestore
- Firebase Cloud Messaging
- Google Maps Platform
- Google Geocoding API
- Vertex AI Gemini

## Key Routes

### Pages
- `/` public map and Signal Pulse
- `/dashboard` coordinator dashboard
- `/report` create need from text
- `/upload` create need from survey image
- `/auth` volunteer sign-in / sign-up
- `/volunteer/register` volunteer profile setup
- `/volunteer/history` volunteer contribution history

### API routes
- `/api/extract` extract and create a need
- `/api/needs` fetch need data
- `/api/match` run volunteer matching
- `/api/volunteers/register` create/update volunteer profile
- `/api/volunteers/me` fetch current volunteer profile
- `/api/volunteers/history` fetch volunteer history
- `/api/intake/sms` intake stub route retained as a webhook-style entry point

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment values:

```bash
cp .env.example .env.local
```

or use `.env` if that is your local convention.

3. Start development:

```bash
npm run dev
```

4. Open:

```text
http://localhost:3000
```

## Clean Restart

If Next.js dev cache becomes inconsistent, use:

```bash
rm -rf .next
npm run dev
```

## Required Google Services

Enable these in your Firebase / GCP project:

- Firestore Database
- Cloud Firestore API
- Firebase Authentication
- Firebase Cloud Messaging
- Maps JavaScript API
- Geocoding API
- Vertex AI API

For email/password sign-up to work, also enable:
- Firebase Authentication → Sign-in method → Email/Password

## Environment Variables

See [.env.example](/home/svsm/Projects/Solution%20Challenge/.env.example:1).

Important groups:

- Firebase web config
- Firebase admin service account values
- Google Maps / Geocoding keys
- FCM VAPID key
- Vertex AI project and location

## Notes

- The sample survey image for testing upload flow is available at [sample-survey-form.svg](/home/svsm/Projects/Solution%20Challenge/public/sample-survey-form.svg:1)
- Build verification currently passes with:
  - `npm run typecheck`
  - `npm run build`
