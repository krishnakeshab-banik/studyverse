import { initializeApp, getApps, getApp, cert } from "firebase-admin/app";
import { getFirestore, FieldValue, Firestore } from "firebase-admin/firestore";

let app;
if (!getApps().length) {
  try {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

    if (privateKey && clientEmail) {
      app = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey: privateKey.replace(/\\n/g, "\n"),
        }),
      });
      console.log("Firebase Admin SDK initialized successfully using Service Account.");
    } else {
      app = initializeApp({
        projectId,
      });
      console.log("Firebase Admin SDK initialized using Project ID fallback.");
    }
  } catch (error) {
    console.error("Failed to initialize Firebase Admin SDK:", error);
  }
} else {
  app = getApp();
}

let dbInstance: Firestore | null = null;

export function getAdminDb(): Firestore {
  if (!dbInstance) {
    dbInstance = getFirestore();
  }
  return dbInstance;
}

// For compatibility with v13 wildcard references:
export const admin = {
  firestore: {
    FieldValue,
  },
};
