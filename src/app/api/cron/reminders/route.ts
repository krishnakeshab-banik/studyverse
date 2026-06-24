import { NextResponse } from "next/server";
import { getAdminDb, admin } from "@/backend/db/firebase-admin";
import { sendReminderEmail } from "@/backend/services/email";

// Set dynamic configuration to ensure this route is not statically optimized
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // Validate the Authorization header against CRON_SECRET
  const authHeader = request.headers.get("Authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    console.error("[Reminder Cron] Unauthorized access attempt.");
    return NextResponse.json(
      {
        success: false,
        error: "Unauthorized",
      },
      { status: 401 }
    );
  }

  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  // Validate the Firebase Admin credentials
  if (
    !clientEmail ||
    clientEmail.includes("your-service-account-email") ||
    !privateKey ||
    privateKey.includes("YOUR_PRIVATE_KEY_HERE")
  ) {
    console.error("[Reminder Cron] Missing or placeholder Firebase Admin credentials");
    return NextResponse.json(
      {
        success: false,
        error: "Missing or placeholder Firebase Admin credentials in .env.local. Please generate a Firebase Service Account key and add it to your environment variables.",
      },
      { status: 400 }
    );
  }

  console.log("[Reminder Cron] Starting reminder sweeps...");
  const now = new Date();

  let checked = 0;
  let sent = 0;
  let failed = 0;

  try {
    // 1. Query Firestore for active, unsent reminders.
    // To avoid requiring a composite index, we use equality queries only, then filter in-memory.
    const adminDb = getAdminDb();
    const sessionsRef = adminDb.collection("calendar_sessions");
    const snapshot = await sessionsRef
      .where("reminder", "==", true)
      .where("reminderSent", "==", false)
      .get();

    console.log(`[Reminder Cron] Found ${snapshot.size} pending reminder documents in Firestore.`);

    // 2. Loop through and process each session in-memory
    for (const doc of snapshot.docs) {
      checked++;
      const data = doc.data();
      const docId = doc.id;

      // Extract details
      const subject = data.subject || "No Subject";
      const topic = data.topic || "No Topic";
      const duration = data.duration || 0;
      const userEmail = data.userEmail;
      const reminderMinutes = data.reminderMinutes !== undefined ? data.reminderMinutes : 30; // default 30 mins
      const scheduledStartTimeVal = data.scheduledStartTime;

      if (!scheduledStartTimeVal) {
        console.warn(`[Reminder Cron] Session ${docId} is missing scheduledStartTime. Skipping.`);
        continue;
      }

      // Convert Firestore Timestamp to JS Date
      const scheduledStartTime = scheduledStartTimeVal.toDate();

      // Calculate trigger time: scheduledStartTime - reminderMinutes
      const triggerTime = new Date(scheduledStartTime.getTime() - reminderMinutes * 60 * 1000);

      console.log(`[Reminder Cron] Checking Session:
        ID: ${docId}
        Subject: ${subject}
        Topic: ${topic}
        Scheduled Start Time: ${scheduledStartTime.toISOString()}
        Reminder Minutes: ${reminderMinutes}
        Trigger Time: ${triggerTime.toISOString()}
        Current Time: ${now.toISOString()}
      `);

      // Determine if reminder should be sent: triggerTime <= now
      if (now >= triggerTime) {
        console.log(`[Reminder Cron] Session ${docId} is due!`);

        // If Google Calendar sync was successful, bypass standard email reminder
        if (data.googleSynced === true) {
          console.log(`[Reminder Cron] Session ${docId} is Google Synced. Google Calendar handles reminders. Bypassing email.`);
          await doc.ref.update({
            reminderSent: true,
            reminderSentAt: admin.firestore.FieldValue.serverTimestamp(),
            lastEmailStatus: "google_calendar",
            notificationProvider: "google",
          });
          sent++;
          continue;
        }

        console.log(`[Reminder Cron] Triggering email...`);

        if (!userEmail) {
          console.error(`[Reminder Cron] Session ${docId} is missing userEmail. Marking as failed.`);
          await doc.ref.update({
            lastEmailStatus: "failed",
            notificationProvider: "email",
          });
          failed++;
          continue;
        }

        // Format start time for display
        const formattedStartTime = scheduledStartTime.toLocaleString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        });

        // Send email
        const emailResult = await sendReminderEmail({
          to: userEmail,
          subject,
          topic,
          startTime: formattedStartTime,
          duration,
        });

        if (emailResult.success) {
          console.log(`[Reminder Cron] Email sent successfully for session ${docId}. Updating document.`);
          await doc.ref.update({
            reminderSent: true,
            reminderSentAt: admin.firestore.FieldValue.serverTimestamp(),
            lastEmailStatus: "sent",
            notificationProvider: "email",
          });
          sent++;
        } else {
          console.error(`[Reminder Cron] Email failed to send for session ${docId}: ${emailResult.error}`);
          await doc.ref.update({
            lastEmailStatus: "failed",
            notificationProvider: "email",
          });
          failed++;
        }
      } else {
        console.log(`[Reminder Cron] Session ${docId} is not due yet.`);
      }
    }

    console.log(`[Reminder Cron] Sweep completed. Checked: ${checked}, Sent: ${sent}, Failed: ${failed}`);
    return NextResponse.json({
      success: true,
      summary: {
        checked,
        sent,
        failed,
      },
    });
  } catch (error: any) {
    console.error("[Reminder Cron] Error running sweeps:", error);
    return NextResponse.json(
      { success: false, error: error.message || String(error) },
      { status: 500 }
    );
  }
}
