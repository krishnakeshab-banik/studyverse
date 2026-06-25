import { initializeApp, getApps, getApp, cert, type App } from "firebase-admin/app";

import { getFirestore, FieldValue, type Firestore } from "firebase-admin/firestore";



const ADMIN_APP_NAME = "studyverse-admin";



const ADMIN_SETUP_HINT =

  "Add FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY to .env.local (Firebase Console → Project Settings → Service accounts → Generate new private key). Restart the dev server after updating env vars.";



function isPlaceholder(value: string): boolean {

  const v = value.toLowerCase();

  return (

    v.includes("your-service-account") ||

    v.includes("your_private_key") ||

    v.includes("your-private-key") ||

    v.includes("placeholder") ||

    v === "your-project-id"

  );

}



function normalizePrivateKey(raw: string): string {

  let key = raw.trim();

  if ((key.startsWith('"') && key.endsWith('"')) || (key.startsWith("'") && key.endsWith("'"))) {

    key = key.slice(1, -1);

  }

  return key.replace(/\\n/g, "\n");

}



function parseServiceAccountFromEnv(): {

  projectId: string;

  clientEmail: string;

  privateKey: string;

} | null {

  const projectId =

    process.env.FIREBASE_PROJECT_ID ||

    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||

    "";



  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();

  const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;



  if (

    clientEmail &&

    privateKeyRaw &&

    !isPlaceholder(clientEmail) &&

    !isPlaceholder(privateKeyRaw)

  ) {

    return {

      projectId,

      clientEmail,

      privateKey: normalizePrivateKey(privateKeyRaw),

    };

  }



  const jsonRaw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();

  if (jsonRaw && !isPlaceholder(jsonRaw)) {

    try {

      const parsed = JSON.parse(jsonRaw) as {

        project_id?: string;

        client_email?: string;

        private_key?: string;

      };

      if (parsed.client_email && parsed.private_key) {

        return {

          projectId: parsed.project_id || projectId,

          clientEmail: parsed.client_email,

          privateKey: parsed.private_key,

        };

      }

    } catch {

      // fall through

    }

  }



  return null;

}



let app: App | undefined;

let cachedInitError: string | null = null;



function ensureAdminApp(): App {

  if (app) return app;

  if (cachedInitError) throw new Error(cachedInitError);



  const existingNamed = getApps().find((candidate) => candidate.name === ADMIN_APP_NAME);

  if (existingNamed) {

    app = existingNamed;

    return app;

  }



  const serviceAccount = parseServiceAccountFromEnv();

  if (!serviceAccount) {

    cachedInitError = ADMIN_SETUP_HINT;

    throw new Error(cachedInitError);

  }



  try {

    app = initializeApp(

      {

        credential: cert(serviceAccount),

        projectId: serviceAccount.projectId || undefined,

      },

      ADMIN_APP_NAME,

    );

    console.log("Firebase Admin SDK initialized with service account credentials.");

    return app;

  } catch (error) {

    const message = error instanceof Error ? error.message : String(error);

    cachedInitError = `Firebase Admin initialization failed: ${message}. ${ADMIN_SETUP_HINT}`;

    throw new Error(cachedInitError);

  }

}



export function isAdminConfigured(): boolean {

  try {

    ensureAdminApp();

    return true;

  } catch {

    return false;

  }

}



export function getAdminDb(): Firestore {

  return getFirestore(ensureAdminApp());

}



export const admin = {

  firestore: {

    FieldValue,

  },

};


