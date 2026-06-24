import * as admin from "firebase-admin";

if (!admin.apps.length) {
  try {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

    if (privateKey && clientEmail) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, "\n"),
        }),
      });
      console.log("Firebase Admin SDK initialized successfully using Service Account.");
    } else {
      // Graceful fallback for local emulator or environments with default application credentials
      admin.initializeApp({
        projectId,
      });
      console.log("Firebase Admin SDK initialized using Project ID fallback.");
    }
  } catch (error) {
    console.error("Failed to initialize Firebase Admin SDK:", error);
  }
}

let dbInstance: admin.firestore.Firestore | null = null;

export function getAdminDb() {
  if (!dbInstance) {
    dbInstance = admin.firestore();
  }
  return dbInstance;
}

export { admin };
