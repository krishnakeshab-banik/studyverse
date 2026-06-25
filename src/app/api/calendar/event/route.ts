import { NextResponse } from "next/server";
import { getAdminDb } from "@/backend/db/firebase-admin";
import {
  createGoogleCalendarEvent,
  deleteGoogleCalendarEvent,
} from "@/backend/google/calendar-client";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { sessionId, userId } = (await request.json()) as {
      sessionId?: string;
      userId?: string;
    };

    if (!sessionId || !userId) {
      return NextResponse.json(
        { success: false, error: "Missing sessionId or userId" },
        { status: 400 },
      );
    }

    let adminDb;
    try {
      adminDb = getAdminDb();
    } catch (adminError) {
      const msg = adminError instanceof Error ? adminError.message : String(adminError);
      return NextResponse.json({ success: false, error: msg }, { status: 503 });
    }

    const sessionDoc = await adminDb.collection("calendar_sessions").doc(sessionId).get();
    if (!sessionDoc.exists) {
      return NextResponse.json({ success: false, error: "Session not found" }, { status: 404 });
    }

    const session = sessionDoc.data()!;
    if (session.userId !== userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    const googleEventId = await createGoogleCalendarEvent(userId, {
      subject: session.subject,
      topic: session.topic,
      date: session.date,
      startTime: session.startTime,
      duration: session.duration,
    });

    await adminDb.collection("calendar_sessions").doc(sessionId).set(
      { googleSynced: true, googleEventId },
      { merge: true },
    );

    return NextResponse.json({ success: true, googleEventId });
  } catch (error) {
    console.error("[Calendar Event] Create error:", error);
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const googleEventId = searchParams.get("googleEventId");
    const userId = searchParams.get("userId");

    if (!googleEventId || !userId) {
      return NextResponse.json(
        { success: false, error: "Missing googleEventId or userId" },
        { status: 400 },
      );
    }

    try {
      getAdminDb();
    } catch (adminError) {
      const msg = adminError instanceof Error ? adminError.message : String(adminError);
      return NextResponse.json({ success: false, error: msg }, { status: 503 });
    }

    await deleteGoogleCalendarEvent(userId, googleEventId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Calendar Event] Delete error:", error);
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

