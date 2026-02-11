# AnaCoo Appointment + Google Calendar Integration

This project now includes a backend API that creates Google Calendar events whenever a customer confirms an appointment from the website.

## 1) Install dependencies

```bash
npm install
```

## 2) Configure environment

1. Copy `.env.example` to `.env`.
2. Fill in these values:
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`
   - `GOOGLE_CALENDAR_ID`
   - `GOOGLE_CALENDAR_TIMEZONE` (default: `Asia/Kuala_Lumpur`)
   - `ALLOWED_ORIGIN` (for production domain)
3. Share your Google Calendar with the service account email with **Make changes to events** permission.

## 3) Run locally

```bash
npm start
```

Open: `http://localhost:3000`

## API endpoint

- `POST /api/appointments`
- Expected JSON payload:

```json
{
  "startDateTime": "2026-02-12T03:00:00.000Z",
  "endDateTime": "2026-02-12T03:30:00.000Z",
  "customerName": "Aisyah",
  "customerPhone": "+60 12-345 6789",
  "notes": "Jeans hem adjustment",
  "language": "en"
}
```

The frontend appointment button now:
1. Validates selected date/time.
2. Sends appointment data to `/api/appointments`.
3. Creates a Google Calendar event.
4. Redirects to WhatsApp for final confirmation message.


## Why "Unable to create appointment" can happen

This error appears when the website can load, but the backend API is unavailable or not configured:

- Static hosting only (no Node server running), so `/api/appointments` returns `404`.
- Missing Google environment variables in `.env`.
- Calendar was not shared with the service account email.

The frontend now falls back to WhatsApp booking if calendar auto-save fails, so customers can still confirm appointments manually.
