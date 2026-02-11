const path = require('path');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { google } = require('googleapis');

dotenv.config();

const {
  PORT = 3000,
  GOOGLE_SERVICE_ACCOUNT_EMAIL,
  GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY,
  GOOGLE_CALENDAR_ID,
  GOOGLE_CALENDAR_TIMEZONE = 'Asia/Kuala_Lumpur',
  ALLOWED_ORIGIN
} = process.env;

if (!GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || !GOOGLE_CALENDAR_ID) {
  console.warn('[appointment-api] Missing one or more Google Calendar environment variables.');
}

const app = express();

app.use(cors({
  origin: ALLOWED_ORIGIN ? ALLOWED_ORIGIN.split(',').map((value) => value.trim()) : true
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname)));

function getAuthClient() {
  return new google.auth.JWT({
    email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/calendar']
  });
}

function validatePayload(body) {
  const { startDateTime, endDateTime, customerName = '', customerPhone = '', notes = '', language = 'en' } = body || {};

  if (!startDateTime || !endDateTime) {
    return { error: 'startDateTime and endDateTime are required.' };
  }

  const start = new Date(startDateTime);
  const end = new Date(endDateTime);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
    return { error: 'Invalid appointment date/time range.' };
  }

  if (end.getTime() - start.getTime() > 2 * 60 * 60 * 1000) {
    return { error: 'Appointment duration is too long.' };
  }

  return {
    start,
    end,
    customerName: String(customerName).trim().slice(0, 120),
    customerPhone: String(customerPhone).trim().slice(0, 80),
    notes: String(notes).trim().slice(0, 1200),
    language: ['en', 'zh', 'ms'].includes(language) ? language : 'en'
  };
}

app.post('/api/appointments', async (req, res) => {
  if (!GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || !GOOGLE_CALENDAR_ID) {
    return res.status(500).json({ error: 'Server calendar configuration is missing.' });
  }

  const parsed = validatePayload(req.body);
  if (parsed.error) {
    return res.status(400).json({ error: parsed.error });
  }

  const { start, end, customerName, customerPhone, notes, language } = parsed;

  try {
    const auth = getAuthClient();
    const calendar = google.calendar({ version: 'v3', auth });

    const event = {
      summary: `AnaCoo Appointment${customerName ? ` - ${customerName}` : ''}`,
      description: [
        `Language: ${language}`,
        `Customer Name: ${customerName || '-'}`,
        `Customer Phone: ${customerPhone || '-'}`,
        `Notes: ${notes || '-'}`,
        'Source: Website appointment form'
      ].join('\n'),
      start: {
        dateTime: start.toISOString(),
        timeZone: GOOGLE_CALENDAR_TIMEZONE
      },
      end: {
        dateTime: end.toISOString(),
        timeZone: GOOGLE_CALENDAR_TIMEZONE
      }
    };

    const insertResponse = await calendar.events.insert({
      calendarId: GOOGLE_CALENDAR_ID,
      requestBody: event
    });

    return res.status(201).json({
      ok: true,
      eventId: insertResponse.data.id,
      eventLink: insertResponse.data.htmlLink
    });
  } catch (error) {
    console.error('[appointment-api] Failed to create event', error?.message || error);
    return res.status(502).json({ error: 'Failed to create Google Calendar event.' });
  }
});

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`[appointment-api] Running on http://localhost:${PORT}`);
});
