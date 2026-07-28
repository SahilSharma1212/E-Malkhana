// lib/firebaseAdmin.ts
import admin from "firebase-admin";

// Initialize the Admin SDK only when service-account credentials are present.
// This keeps `import`-ing this module safe (it never throws at build/module
// load if env vars are missing); a missing config instead surfaces when
// `admin.auth()` is called and is caught by the caller as an auth failure
// (fail-closed — no session is minted).
const hasCredentials =
  !!process.env.FIREBASE_PROJECT_ID &&
  !!process.env.FIREBASE_CLIENT_EMAIL &&
  !!process.env.FIREBASE_PRIVATE_KEY;

if (!admin.apps.length && hasCredentials) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, "\n"),
    }),
  });
}

export { admin };
