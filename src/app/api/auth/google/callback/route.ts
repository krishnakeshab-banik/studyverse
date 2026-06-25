import { NextResponse } from "next/server";
import { getAdminDb, admin } from "@/backend/db/firebase-admin";
import { googleOAuthErrorHtml } from "@/backend/google/oauth-error-page";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const stateToken = searchParams.get("state");
    const oauthError = searchParams.get("error");

    if (oauthError) {
      return new Response(
        googleOAuthErrorHtml("Google sign-in cancelled", "Connection was cancelled or denied."),
        { status: 400, headers: { "Content-Type": "text/html" } },
      );
    }

    if (!code || !stateToken) {
      return new Response(
        googleOAuthErrorHtml("Invalid callback", "Missing authorization code. Please try connecting again."),
        { status: 400, headers: { "Content-Type": "text/html" } },
      );
    }

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
    const stateDocRef = adminDb.collection("oauth_states").doc(stateToken);
    const stateDoc = await stateDocRef.get();

    // Verify token exists and is valid
    if (!stateDoc.exists) {
      return NextResponse.json(
        { success: false, error: "Invalid, expired, or already used OAuth state token" },
        { status: 401 }
      );
    }

    const stateData = stateDoc.data();
    if (!stateData || !stateData.uid || !stateData.createdAt) {
      return NextResponse.json(
        { success: false, error: "Invalid state session data" },
        { status: 401 }
      );
    }

    const uid = stateData.uid;
    const createdAt = stateData.createdAt.toDate();

    // Delete the state token immediately to prevent replay attacks (one-time use)
    await stateDocRef.delete();

    // Enforce 10-minute expiry on the state token
    const tenMinutes = 10 * 60 * 1000;
    if (Date.now() - createdAt.getTime() > tenMinutes) {
      return NextResponse.json(
        { success: false, error: "OAuth state token expired (limit 10 minutes)" },
        { status: 401 }
      );
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { success: false, error: "Google credentials not configured" },
        { status: 500 }
      );
    }

    // Reconstruct the redirect URI dynamically to match the login redirect URI exactly
    const host = request.headers.get("host");
    const protocol = host && (host.includes("localhost") || host.includes("127.0.0.1")) ? "http" : "https";
    const redirectUri = `${protocol}://${host}/api/auth/google/callback`;

    // Exchange code for tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("[Google Auth Callback] Token exchange failed:", errorText);
      return NextResponse.json(
        { success: false, error: "Failed to exchange authorization code for tokens", details: errorText },
        { status: 400 }
      );
    }

    const tokens = await tokenResponse.json();

    // Fetch user profile from Google to get the email address
    const userinfoResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    });

    if (!userinfoResponse.ok) {
      console.error("[Google Auth Callback] Userinfo fetch failed:", await userinfoResponse.text());
      return NextResponse.json(
        { success: false, error: "Failed to retrieve user information from Google" },
        { status: 400 }
      );
    }

    const googleUser = await userinfoResponse.json();
    const email = googleUser.email;

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Google account does not have an email address" },
        { status: 400 }
      );
    }

    // Save public status fields
    await adminDb.collection("users").doc(uid).set({
      googleCalendarConnected: true,
      googleEmail: email,
      googleConnectedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    // Save sensitive tokens in the private user_tokens collection
    const tokenData: any = {
      googleAccessToken: tokens.access_token,
      googleTokenExpiry: Date.now() + tokens.expires_in * 1000,
    };
    // Note: Google only sends the refresh_token on the first prompt consent, store it if present
    if (tokens.refresh_token) {
      tokenData.googleRefreshToken = tokens.refresh_token;
    }

    await adminDb.collection("user_tokens").doc(uid).set(tokenData, { merge: true });

    console.log(`[Google Auth Callback] User ${uid} connected Google Calendar account ${email} successfully.`);

    // Return HTML page that sends message to opener and closes
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Google Calendar Connected</title>
        </head>
        <body style="background-color: #080808; color: #ffffff; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
          <div style="text-align: center; background: #0c0c0c; border: 1px solid rgba(255,255,255,0.06); padding: 40px; border-radius: 20px; box-shadow: 0 4px 30px rgba(0,0,0,0.5);">
            <div style="font-size: 48px; margin-bottom: 20px;">🟢</div>
            <h1 style="font-size: 24px; margin-bottom: 10px;">Connection Successful!</h1>
            <p style="color: #a0a0a0; font-size: 14px; margin-bottom: 20px;">Google Calendar has been successfully linked to your StudyVerse account.</p>
            <p style="color: #666; font-size: 12px;">This window will close automatically...</p>
          </div>
          <script>
            if (window.opener) {
              window.opener.postMessage(
                { type: "GOOGLE_CALENDAR_CONNECTED", email: "${email}" },
                window.location.origin
              );
            }
            setTimeout(() => {
              window.close();
            }, 1000);
          </script>
        </body>
      </html>
    `;

    return new Response(html, {
      headers: {
        "Content-Type": "text/html",
      },
    });
  } catch (error: unknown) {
    console.error("[Google Auth Callback] Error:", error);
    const msg = error instanceof Error ? error.message : String(error);
    return new Response(
      googleOAuthErrorHtml("Connection failed", msg),
      { status: 500, headers: { "Content-Type": "text/html" } },
    );
  }
}
