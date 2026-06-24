import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function hasValidConfig(): boolean {
  return Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.authDomain &&
      firebaseConfig.projectId &&
      firebaseConfig.appId
  );
}

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

function ensureFirebase() {
  if (app) {
    return { app, auth: auth!, db: db!, storage: storage! };
  }

  if (!hasValidConfig()) {
    return null;
  }

  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
  return { app, auth, db, storage };
}

const missingConfigError =
  "Firebase is not configured. Set NEXT_PUBLIC_FIREBASE_API_KEY and related env vars.";

export function getFirebaseApp(): FirebaseApp | null {
  if (typeof window === "undefined" && !hasValidConfig()) {
    return null;
  }
  return ensureFirebase()?.app ?? null;
}

export function getClientAuth(): Auth {
  if (typeof window === "undefined" && !hasValidConfig()) {
    throw new Error(
      "Firebase Auth is unavailable during SSR. Call getClientAuth() from client effects or handlers."
    );
  }

  const firebase = ensureFirebase();
  if (!firebase) {
    throw new Error(missingConfigError);
  }

  return firebase.auth;
}

export function getClientDb(): Firestore {
  if (typeof window === "undefined" && !hasValidConfig()) {
    throw new Error(
      "Firestore is unavailable during SSR without Firebase config."
    );
  }

  const firebase = ensureFirebase();
  if (!firebase) {
    throw new Error(missingConfigError);
  }

  return firebase.db;
}

export function getClientStorage(): FirebaseStorage {
  if (typeof window === "undefined" && !hasValidConfig()) {
    throw new Error(
      "Firebase Storage is unavailable during SSR without Firebase config."
    );
  }

  const firebase = ensureFirebase();
  if (!firebase) {
    throw new Error(missingConfigError);
  }

  return firebase.storage;
}
