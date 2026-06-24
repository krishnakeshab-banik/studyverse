import { NextResponse } from "next/server";
import { sendTestEmail } from "@/backend/services/email";

export async function GET() {
  const testEmail = process.env.TEST_EMAIL;
  const resendApiKey = process.env.RESEND_API_KEY;

  // Validate the TEST_EMAIL environment variable
  if (!testEmail || testEmail === "your_verified_resend_email@gmail.com") {
    console.error("Missing or invalid TEST_EMAIL in environment variables");
    return NextResponse.json(
      {
        success: false,
        error: "Missing or invalid TEST_EMAIL in environment variables. Please update your .env.local file with your verified Resend email address.",
      },
      { status: 400 }
    );
  }

  // Validate the RESEND_API_KEY environment variable
  if (!resendApiKey || resendApiKey === "your_resend_api_key_here") {
    console.error("Missing or invalid RESEND_API_KEY in environment variables");
    return NextResponse.json(
      {
        success: false,
        error: "Missing or invalid RESEND_API_KEY in environment variables. Please update your .env.local file with your Resend API Key.",
      },
      { status: 400 }
    );
  }

  try {
    console.log(`Attempting to send test email to: ${testEmail}`);
    const result = await sendTestEmail(testEmail);

    if (result.success) {
      console.log(`Test email sent successfully to ${testEmail}`);
      return NextResponse.json({ success: true, data: result.data });
    } else {
      console.error(`Failed to send email: ${result.error}`);
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Endpoint runtime error:", error);
    return NextResponse.json(
      { success: false, error: error.message || String(error) },
      { status: 500 }
    );
  }
}
