import { getAdminDb } from "@/backend/db/firebase-admin";

interface TokenRecord {
  googleAccessToken?: string;
  googleRefreshToken?: string;
  googleTokenExpiry?: number;
}

async function refreshAccessToken(
  userId: string,
  refreshToken: string,
): Promise<string | null> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    console.error("[Google Calendar] Token refresh failed:", await response.text());
    return null;
  }

  const tokens = (await response.json()) as {
    access_token: string;
    expires_in: number;
  };

  await getAdminDb()
    .collection("user_tokens")
    .doc(userId)
    .set(
      {
        googleAccessToken: tokens.access_token,
        googleTokenExpiry: Date.now() + tokens.expires_in * 1000,
      },
      { merge: true },
    );

  return tokens.access_token;
}

export async function getGoogleAccessToken(userId: string): Promise<string | null> {
  const tokenDoc = await getAdminDb().collection("user_tokens").doc(userId).get();
  if (!tokenDoc.exists) return null;

  const data = tokenDoc.data() as TokenRecord;
  const accessToken = data.googleAccessToken;
  const expiry = data.googleTokenExpiry ?? 0;

  if (accessToken && Date.now() < expiry - 60_000) {
    return accessToken;
  }

  if (data.googleRefreshToken) {
    return refreshAccessToken(userId, data.googleRefreshToken);
  }

  return accessToken ?? null;
}

interface CalendarSession {
  subject: string;
  topic: string;
  date: string;
  startTime: string;
  duration: number;
}

function buildEventTimes(session: CalendarSession): { start: string; end: string } {
  const [year, month, day] = session.date.split("-").map(Number);
  const [hour, minute] = session.startTime.split(":").map(Number);
  const start = new Date(year, month - 1, day, hour, minute);
  const end = new Date(start.getTime() + (session.duration || 1) * 60 * 60 * 1000);

  const format = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;
  };

  return { start: format(start), end: format(end) };
}

export async function createGoogleCalendarEvent(
  userId: string,
  session: CalendarSession,
): Promise<string> {
  const accessToken = await getGoogleAccessToken(userId);
  if (!accessToken) {
    throw new Error("Google Calendar is not connected or the access token expired. Reconnect in Calendar settings.");
  }

  const { start, end } = buildEventTimes(session);
  const summary = session.topic ? `${session.subject}: ${session.topic}` : session.subject;

  const response = await fetch(
    "https://www.googleapis.com/calendar/v3/calendars/primary/events",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        summary,
        description: `Study session on StudyVerse — ${session.subject}${session.topic ? ` (${session.topic})` : ""}`,
        start: { dateTime: start, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC" },
        end: { dateTime: end, timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC" },
      }),
    },
  );

  if (!response.ok) {
    const details = await response.text();
    console.error("[Google Calendar] Create event failed:", details);
    throw new Error("Failed to create Google Calendar event");
  }

  const event = (await response.json()) as { id: string };
  return event.id;
}

export async function deleteGoogleCalendarEvent(
  userId: string,
  googleEventId: string,
): Promise<void> {
  const accessToken = await getGoogleAccessToken(userId);
  if (!accessToken) return;

  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(googleEventId)}`,
    {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );

  if (!response.ok && response.status !== 404) {
    console.error("[Google Calendar] Delete event failed:", await response.text());
  }
}

