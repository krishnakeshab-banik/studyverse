import { NextResponse } from "next/server";
import { getAdminDb, admin } from "@/backend/db/firebase-admin";

export const dynamic = "force-dynamic";

// Helper to refresh Google OAuth access token if expired
async function getValidAccessToken(userId: string): Promise<string | null> {
  const adminDb = getAdminDb();
  const tokenDocRef = adminDb.collection("user_tokens").doc(userId);
  const tokenDoc = await tokenDocRef.get();

  if (!tokenDoc.exists) {
    console.error(`[Google Calendar Sync] No tokens found for user ${userId}`);
    return null;
  }

  const data = tokenDoc.data();
  if (!data) return null;

  const { googleAccessToken, googleRefreshToken, googleTokenExpiry } = data;

  // If token is valid (expiry is in the future, with a 60 second buffer), return it
  if (googleTokenExpiry && Date.now() < googleTokenExpiry - 60000) {
    return googleAccessToken;
  }

  // If token has expired or is about to expire, refresh it
  if (!googleRefreshToken) {
    console.error(`[Google Calendar Sync] Access token expired and no refresh token available for user ${userId}`);
    return null;
  }

  console.log(`[Google Calendar Sync] Access token expired or expiring soon for user ${userId}. Refreshing...`);

  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      console.error("[Google Calendar Sync] Google credentials not configured in environment");
      return null;
    }

    const refreshResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: googleRefreshToken,
        grant_type: "refresh_token",
      }),
    });

    if (!refreshResponse.ok) {
      const errorText = await refreshResponse.text();
      console.error(`[Google Calendar Sync] Token refresh failed for user ${userId}:`, errorText);
      return null;
    }

    const newTokens = await refreshResponse.json();
    const newAccessToken = newTokens.access_token;
    const newExpiry = Date.now() + newTokens.expires_in * 1000;

    // Save the new access token back to the private user_tokens document
    await tokenDocRef.update({
      googleAccessToken: newAccessToken,
      googleTokenExpiry: newExpiry,
    });

    console.log(`[Google Calendar Sync] Token successfully refreshed for user ${userId}.`);
    return newAccessToken;
  } catch (error) {
    console.error(`[Google Calendar Sync] Error refreshing token for user ${userId}:`, error);
    return null;
  }
}

// POST endpoint: Create a Google Calendar Event
export async function POST(request: Request) {
  let sessionId: string | null = null;
  try {
    const body = await request.json();
    sessionId = body.sessionId;
    const userId = body.userId;

    if (!sessionId || !userId) {
      return NextResponse.json(
        { success: false, error: "Missing sessionId or userId in request body" },
        { status: 400 }
      );
    }

    const adminDb = getAdminDb();
    
    // 1. Fetch the study session document
    const sessionDocRef = adminDb.collection("calendar_sessions").doc(sessionId);
    const sessionDoc = await sessionDocRef.get();

    if (!sessionDoc.exists) {
      return NextResponse.json(
        { success: false, error: `Session ${sessionId} not found` },
        { status: 404 }
      );
    }

    const sessionData = sessionDoc.data();
    if (!sessionData) {
      return NextResponse.json(
        { success: false, error: `Session data for ${sessionId} is empty` },
        { status: 500 }
      );
    }

    // 2. Get a valid access token for the user
    const accessToken = await getValidAccessToken(userId);
    if (!accessToken) {
      // Mark session as not synced so the standard StudyVerse email reminder acts as a backup
      await sessionDocRef.update({ googleSynced: false });
      return NextResponse.json(
        { success: false, error: "Unable to authorize with Google (tokens missing or expired)" },
        { status: 401 }
      );
    }

    // 3. Construct event times
    const scheduledStartTimeVal = sessionData.scheduledStartTime;
    if (!scheduledStartTimeVal) {
      await sessionDocRef.update({ googleSynced: false });
      return NextResponse.json(
        { success: false, error: "Session scheduledStartTime is missing" },
        { status: 400 }
      );
    }

    const start = scheduledStartTimeVal.toDate();
    const duration = sessionData.duration || 1; // in hours
    const end = new Date(start.getTime() + duration * 60 * 60 * 1000);

    const subject = sessionData.subject || "Study Session";
    const topic = sessionData.topic || "General Focus";
    const reminder = sessionData.reminder;
    const reminderMinutes = sessionData.reminderMinutes || 30;

    // 4. Construct reminders overrides
    const remindersPayload = reminder
      ? {
          useDefault: false,
          overrides: [
            {
              method: "popup",
              minutes: reminderMinutes,
            },
          ],
        }
      : {
          useDefault: false,
          overrides: [],
        };

    // 5. Build Google Calendar Event structure
    const eventPayload = {
      summary: subject,
      description: `${topic}\nDuration: ${duration} hour(s)\nCreated from StudyVerse`,
      start: {
        dateTime: start.toISOString(),
        timeZone: "UTC",
      },
      end: {
        dateTime: end.toISOString(),
        timeZone: "UTC",
      },
      reminders: remindersPayload,
    };

    console.log(`[Google Calendar Sync] Syncing event for user ${userId}:`, JSON.stringify(eventPayload));

    // 6. Insert event into Google Calendar
    const calendarResponse = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(eventPayload),
    });

    if (!calendarResponse.ok) {
      const errorText = await calendarResponse.text();
      console.error("[Google Calendar Sync] Failed to create Google Calendar Event:", errorText);
      await sessionDocRef.update({ googleSynced: false });
      return NextResponse.json(
        { success: false, error: "Failed to create Google Calendar Event", details: errorText },
        { status: 502 }
      );
    }

    const createdEvent = await calendarResponse.json();
    const googleEventId = createdEvent.id;

    // 7. Update session in Firestore with sync details
    await sessionDocRef.update({
      googleSynced: true,
      googleEventId,
    });

    console.log(`[Google Calendar Sync] Successfully synced session ${sessionId} to Google Calendar. Event ID: ${googleEventId}`);
    return NextResponse.json({ success: true, googleEventId });

  } catch (error: any) {
    console.error("[Google Calendar Sync] Error in event creation POST route:", error);
    if (sessionId) {
      try {
        await getAdminDb().collection("calendar_sessions").doc(sessionId).update({ googleSynced: false });
      } catch (err) {
        console.error("[Google Calendar Sync] Failed to fallback googleSynced flag:", err);
      }
    }
    return NextResponse.json(
      { success: false, error: error.message || String(error) },
      { status: 500 }
    );
  }
}

// DELETE endpoint: Delete a Google Calendar Event
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const googleEventId = searchParams.get("googleEventId");
    const userId = searchParams.get("userId");

    if (!googleEventId || !userId) {
      return NextResponse.json(
        { success: false, error: "Missing googleEventId or userId query parameters" },
        { status: 400 }
      );
    }

    const accessToken = await getValidAccessToken(userId);
    if (!accessToken) {
      return NextResponse.json(
        { success: false, error: "Unable to authorize with Google" },
        { status: 401 }
      );
    }

    console.log(`[Google Calendar Sync] Deleting Google Calendar event ${googleEventId} for user ${userId}...`);

    const calendarResponse = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${googleEventId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    // Note: If the event was already deleted manually in Google Calendar, Google might return 410 Gone or 404 Not Found.
    // We treat 404/410 as success for deletion since our goal is to ensure it no longer exists.
    if (!calendarResponse.ok && calendarResponse.status !== 404 && calendarResponse.status !== 410) {
      const errorText = await calendarResponse.text();
      console.error("[Google Calendar Sync] Failed to delete Google Calendar Event:", errorText);
      return NextResponse.json(
        { success: false, error: "Failed to delete Google Calendar Event", details: errorText },
        { status: 502 }
      );
    }

    console.log(`[Google Calendar Sync] Event ${googleEventId} deleted successfully.`);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[Google Calendar Sync] Error in event deletion DELETE route:", error);
    return NextResponse.json(
      { success: false, error: error.message || String(error) },
      { status: 500 }
    );
  }
}
