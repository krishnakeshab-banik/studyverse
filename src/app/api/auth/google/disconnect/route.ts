import { NextResponse } from "next/server";
import { getAdminDb, admin } from "@/backend/db/firebase-admin";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { userId } = (await request.json()) as { userId?: string };
    if (!userId) {
      return NextResponse.json({ success: false, error: "Missing userId" }, { status: 400 });
    }

    let adminDb;
    try {
      adminDb = getAdminDb();
    } catch (adminError) {
      const msg = adminError instanceof Error ? adminError.message : String(adminError);
      return NextResponse.json({ success: false, error: msg }, { status: 503 });
    }

    await adminDb.collection("users").doc(userId).set(
      {
        googleCalendarConnected: false,
        googleEmail: admin.firestore.FieldValue.delete(),
        googleConnectedAt: admin.firestore.FieldValue.delete(),
      },
      { merge: true },
    );

    await adminDb.collection("user_tokens").doc(userId).delete();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Google Auth Disconnect] Error:", error);
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

