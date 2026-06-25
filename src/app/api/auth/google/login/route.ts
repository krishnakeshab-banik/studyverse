import { NextResponse } from "next/server";
import { getAdminDb, admin } from "@/backend/db/firebase-admin";
import { googleOAuthErrorHtml } from "@/backend/google/oauth-error-page";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const uid = searchParams.get("uid");

    if (!uid) {
      return NextResponse.json(
        { success: false, error: "Missing uid parameter" },
        { status: 400 }
      );
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    if (!clientId || !clientSecret || clientId.includes("your-google-client-id")) {
      return new Response(
        googleOAuthErrorHtml(
          "Google Calendar not configured",
          "Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env.local from Google Cloud Console → APIs & Services → Credentials.",
        ),
        { status: 500, headers: { "Content-Type": "text/html" } },
      );
    }

    // 1. Generate a cryptographically secure random state token
    const stateToken = crypto.randomUUID();

    // 2. Store state mapping in Firestore oauth_states collection
    let adminDb;
    try {
      adminDb = getAdminDb();
    } catch (adminError) {
      const msg = adminError instanceof Error ? adminError.message : String(adminError);
      return new Response(
        googleOAuthErrorHtml("Server configuration required", msg),
        { status: 503, headers: { "Content-Type": "text/html" } },
      );
    }
    await adminDb.collection("oauth_states").doc(stateToken).set({
      uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Determine host and protocol dynamically to handle localhost vs production environments
    const host = request.headers.get("host");
    const protocol = host && (host.includes("localhost") || host.includes("127.0.0.1")) ? "http" : "https";
    const redirectUri = `${protocol}://${host}/api/auth/google/callback`;

    // 3. Construct authorization URL using only the stateToken
    const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", "https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/userinfo.email");
    authUrl.searchParams.set("access_type", "offline");
    authUrl.searchParams.set("prompt", "consent");
    authUrl.searchParams.set("state", stateToken);

    return NextResponse.redirect(authUrl.toString());
  } catch (error: unknown) {
    console.error("[Google Auth Login] Error:", error);
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(
      googleOAuthErrorHtml("Connection failed", msg),
      { status: 500, headers: { "Content-Type": "text/html" } },
    );
  }
}
