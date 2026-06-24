import { Resend } from "resend";

// Initialize Resend with the API key from environment variables
const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Sends a test email to the specified recipient.
 * If no recipient is provided, falls back to the TEST_EMAIL environment variable.
 */
export async function sendTestEmail(to?: string) {
  const recipient = to || process.env.TEST_EMAIL;

  if (!recipient) {
    throw new Error("No recipient email specified (missing 'to' parameter or 'TEST_EMAIL' environment variable)");
  }

  try {
    const { data, error } = await resend.emails.send({
      from: "StudyVerse <onboarding@resend.dev>",
      to: [recipient],
      subject: "StudyVerse Test Email",
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #4f46e5;">StudyVerse Test Email</h2>
          <p>Hello,</p>
          <p>This is a test email from <strong>StudyVerse</strong> to verify that your Resend integration is working correctly!</p>
          <p>If you received this, the Resend setup is working perfectly. You can now proceed to Phase 2 of the reminder implementation.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #666;">This is an automated system email. Please do not reply.</p>
        </div>
      `,
    });

    if (error) {
      console.error("Resend API error:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error: any) {
    console.error("Failed to send test email:", error);
    return { success: false, error: error.message || String(error) };
  }
}

/**
 * Sends a reminder email for an upcoming study session.
 */
export async function sendReminderEmail({
  to,
  subject,
  topic,
  startTime,
  duration,
}: {
  to: string;
  subject: string;
  topic: string;
  startTime: string;
  duration: number;
}) {
  const emailMode = process.env.EMAIL_MODE || "test";
  const testEmail = process.env.TEST_EMAIL;

  // Decide target recipient based on EMAIL_MODE
  let recipient = to;
  if (emailMode !== "production") {
    if (!testEmail) {
      throw new Error("EMAIL_MODE is set to 'test' but TEST_EMAIL environment variable is missing.");
    }
    recipient = testEmail;
    console.log(`[Email Service] EMAIL_MODE is '${emailMode}'. Overriding recipient '${to}' to TEST_EMAIL: '${recipient}'`);
  } else {
    console.log(`[Email Service] EMAIL_MODE is 'production'. Sending email to userEmail: '${recipient}'`);
  }

  try {
    const { data, error } = await resend.emails.send({
      from: "StudyVerse Reminders <onboarding@resend.dev>",
      to: [recipient],
      subject: `Reminder: ${subject} Study Session`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #4f46e5; margin-top: 0;">Study Session Reminder</h2>
          <p>Hello,</p>
          <p>This is a friendly reminder that you have an upcoming study session scheduled:</p>
          
          <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #4f46e5;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 4px 0; font-weight: bold; width: 120px; color: #475569;">Subject:</td>
                <td style="padding: 4px 0; color: #0f172a;">${subject}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; font-weight: bold; color: #475569;">Topic:</td>
                <td style="padding: 4px 0; color: #0f172a;">${topic || "General Study"}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; font-weight: bold; color: #475569;">Start Time:</td>
                <td style="padding: 4px 0; color: #0f172a;">${startTime}</td>
              </tr>
              <tr>
                <td style="padding: 4px 0; font-weight: bold; color: #475569;">Duration:</td>
                <td style="padding: 4px 0; color: #0f172a;">${duration} hours</td>
              </tr>
            </table>
          </div>
          
          <p>Make sure to review your study materials and log in to StudyVerse on time.</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="font-size: 12px; color: #94a3b8; text-align: center;">This is an automated system email from StudyVerse. Please do not reply.</p>
        </div>
      `,
    });

    if (error) {
      console.error("Resend API error:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error: any) {
    console.error("Failed to send reminder email:", error);
    return { success: false, error: error.message || String(error) };
  }
}
