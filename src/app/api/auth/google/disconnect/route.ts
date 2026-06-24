import { NextResponse } from "next/server";
import { getAdminDb } from "@/backend/db/firebase-admin";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Missing userId parameter" },
        { status: 400 }
      );
    }

    const adminDb = getAdminDb();

    // 1. Delete private token document
    await adminDb.collection("user_tokens").doc(userId).delete();

    // 2. Clear connection status in public user doc
    await adminDb.collection("users").doc(userId).set({
      googleCalendarConnected: false,
      googleEmail: "",
      googleConnectedAt: null
    }, { merge: true });

    console.log(`[Google Auth Disconnect] User ${userId} disconnected Google Calendar successfully.`);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[Google Auth Disconnect] Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || String(error) },
      { status: 500 }
    );
  }
}
